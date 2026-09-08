# Spec: Firehose Indexer for `org.micelio.event` / `org.micelio.rsvp`

## Status
Draft — not yet triggered for implementation. See "When to build" below.

## Problem
`appview/src/pds.js:listEvents()` currently does `com.atproto.sync.listRepos`
then fans out to every repo asking for `org.micelio.event` records —
O(repos) per request, no caching, no persistence. Acceptable for MVP scale
(single self-hosted PDS, handful of accounts). Breaks down once account
count grows or federation with other PDSes begins.

## Goal
Replace the live fanout with a standalone consumer process that subscribes
to `com.atproto.sync.subscribeRepos` (the firehose), filters for our
collections, and maintains a queryable Postgres index. `pds.js`'s functions
become DB reads instead of live repo walks.

## Non-goals (explicitly out of scope for this pass)
- Multi-PDS federation / cross-relay dedup
- Full-text search or geo-indexing beyond what's already in the App View
- Any change to the moderation/hide feature's own storage — the indexer
  writes to its own tables; hide-state stays where it already lives

---

## Contract

### Cursor semantics
- Every firehose message carries a monotonic `seq`.
- The consumer persists the last successfully processed `seq` after each
  message (or batch) is committed to the DB.
- On restart, resume subscription from `seq + 1`.
- Never reprocess a `seq` already committed; never skip a `seq` between
  the stored cursor and the first message received on reconnect.

### Backfill vs. live boundary
- On first run (no stored cursor):
  1. Record the current firehose `seq` *before* starting backfill (open
     the subscription first, note the starting seq, then begin the walk —
     do not query the seq after backfill completes).
  2. Walk `com.atproto.sync.listRepos` + `listRecords` for existing
     `org.micelio.event` / `org.micelio.rsvp` records across all repos.
     Upsert each into the index.
  3. Once backfill completes, begin processing the buffered/live firehose
     stream starting at the seq recorded in step 1.
- This ordering (open subscription → snapshot seq → backfill → drain from
  that seq) is required to avoid a gap: writes that land during backfill
  must not be lost, and must not be silently skipped because backfill
  already "saw" them via listRecords (idempotent upsert handles the overlap
  safely — see below).

### Idempotency
- Every write to the index DB is an **upsert** keyed on
  `(did, collection, rkey)` — never a bare insert.
- Firehose can redeliver messages on reconnect. Reprocessing a commit for
  a record already indexed must be a no-op (or overwrite with identical
  data), never a duplicate row or an error.

### Deletes
- A `#commit` op with `action: "delete"` sets a `tombstoned_at` timestamp
  on the existing index row — **soft delete**, not a row removal. This
  matches the existing moderation/hide pattern (App View controls what it
  displays; it doesn't reach into anyone's repo).
- Tombstoned rows are excluded from `listEvents()`/`listRsvps()` queries
  by default.

### Malformed / unrecognized records
- A commit that references `org.micelio.event` or `org.micelio.rsvp` but
  fails lexicon validation is logged (with `did`, `rkey`, `seq`, and the
  validation error) and skipped. The consumer must not crash or halt the
  subscription on a single bad record.

### Reconnect / backoff
- On websocket disconnect, retry with exponential backoff (e.g. 1s base,
  2x multiplier, capped at 60s). No maximum retry count — the consumer
  keeps trying indefinitely, since a firehose outage is not a terminal
  condition.
- On successful reconnect, resume per the cursor semantics above.

### Schema (indexer's own tables — separate from moderation state)
```
indexed_events
  did
  rkey
  record (jsonb — full validated record)
  indexed_at
  tombstoned_at (nullable)
  PRIMARY KEY (did, rkey)

indexed_rsvps
  did
  rkey
  subject_uri (the event strongRef being responded to)
  status (interested | going | notGoing)
  record (jsonb)
  indexed_at
  tombstoned_at (nullable)
  PRIMARY KEY (did, rkey)

indexer_cursor
  id (singleton row, e.g. always id=1)
  seq
  updated_at
```

---

## When to build this (trigger condition)
Do not start implementation until one of:
- Repo/account count exceeds ~200 on the self-hosted PDS, **or**
- `listEvents()` p95 latency exceeds 500ms in production, **or**
- Federation with a second PDS becomes an actual near-term plan

This threshold is stated here so it's a decision anyone on the project can
point back to, rather than re-argued from memory later.

---

## Fixtures (write before implementation)
Each fixture is a literal sequence of firehose commit messages plus the
expected DB state after processing. These are the acceptance tests — the
consumer isn't done until it passes all of them.

1. **`fixture_create_update_delete`** — create an event, update it, then
   delete it. Expect: one row, final state reflects the update, then
   `tombstoned_at` set after the delete commit.
2. **`fixture_restart_mid_backfill`** — simulate a crash after backfill
   has indexed some but not all existing repos, before live streaming
   begins. Expect: on restart, backfill resumes/re-walks safely (idempotent
   upsert) and no records are lost or duplicated.
3. **`fixture_redelivery`** — the same commit delivered twice (simulating
   a reconnect replay). Expect: single row, no duplicate, no error.
4. **`fixture_malformed_record`** — a commit for `org.micelio.event` with
   a missing required field (e.g. no `startsAt`). Expect: logged and
   skipped, consumer continues processing subsequent valid commits.
5. **`fixture_rsvp_subject_ref`** — an rsvp record in one repo referencing
   an event in a different repo. Expect: `indexed_rsvps` row correctly
   stores `subject_uri`, joinable against `indexed_events` for display.
6. **`fixture_reconnect_gap`** — consumer disconnects, some writes happen
   while it's down, it reconnects and resumes from stored cursor. Expect:
   all writes that happened during the gap are eventually indexed once
   the firehose redelivers/replays from that seq.

---

## Implementation order
1. Fixtures written and reviewed (no consumer code yet).
2. Standalone consumer process, tested against fixtures in isolation
   (no `pds.js` changes yet).
3. Only once the consumer passes all fixtures: swap `pds.js`'s
   `listEvents()`/equivalent rsvp function to read from
   `indexed_events`/`indexed_rsvps` instead of live repo fanout.
4. Keep the old fanout code path behind a flag for one release in case
   the indexer needs to be rolled back.
