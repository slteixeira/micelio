# micelio — decentralized event board for antifascist organizing in São Paulo

## What this is

A "Facebook Events, but decentralized" tool for publishing and coordinating
antifascist organizing events in São Paulo. Built on the AT Protocol
(atproto) for the public event listing layer, with a pseudonymous-by-default
identity model and a separate zero-identity path for low-stakes engagement.

Not a general-purpose imageboard, not a Mobilizon fork — a narrow, purpose-built
tool for one use case: publish an event, let people signal attendance, resist
a single point of takedown.

---

## Why atproto (and not ActivityPub / plain P2P)

Considered three approaches:

| Approach | Identity model | Maturity for this use case | Verdict |
|---|---|---|---|
| ActivityPub (Mobilizon) | Tied to home instance | Mature, deployable today | Good fallback, less resilient identity |
| Full P2P (libp2p/CRDT) | Self-sovereign | Hard discoverability, high build cost | Overkill for MVP |
| **atproto** | **DID-based, portable across PDS** | **Immature ecosystem, but strong identity guarantees** | **Chosen** |

The deciding factor: atproto decouples identity (DID) from the server hosting
it. If a PDS gets pressured or taken down, a user's identity and repo can
migrate elsewhere without losing history. That's a meaningfully better
threat model for this specific use case than ActivityPub's instance-bound
identity.

**Tradeoff accepted:** no existing "Mobilizon of atproto" — the lexicon,
PDS customization, and App View are being built from scratch.

---

## Identity model: pseudonymous accounts + anonymous counter

atproto has no anonymous-write primitive — every record is signed by a DID
keypair. Full anonymity and atproto pull in different directions. Resolved
as a two-track split:

### Track 1 — Pseudonymous atproto accounts
- For organizers and anyone who wants a persistent (but not real-name)
  identity
- Handles are throwaway-style (`maria9284.yourpds.org`) — no phone/email/
  real name required
- Required for: creating events, "official" RSVPs with attendance history

### Track 2 — Anonymous interest counter
- No account, no DID, no atproto record at all
- Plain HTTP endpoint on the App View: `POST /events/:did/:rkey/interested`
- Increments a SQLite counter (the original design below called for
  Postgres — actual build uses SQLite everywhere, simpler for this scale);
  no long-term session/IP linkage
- Anti-bot: short-lived signed token from `GET /challenge`, required on
  the write — accepted as a soft, spammable signal, not a trust signal

Event pages display both numbers separately and labeled, so users understand
which is cryptographically attributable vs. a vibe-check.

**Important constraint:** atproto records are public-by-default once
federated. `visibility: restricted` on an event is a soft UI hint only,
**not real access control**. Sensitive event details (precise time/location
for higher-risk actions) should not go in the public record — use an
out-of-band encrypted channel (Signal) and treat the atproto record as a
public pointer only, if it exists at all.

---

## Lexicons

### `org.micelio.event`
Event record — title, description, start/end time, location (geo, address,
or online), cover image, visibility hint. Full draft in `lexicons/event.json`.

### `org.micelio.rsvp`
Attendance record, stored **in the attendee's own repo** (not the event's),
mirroring `app.bsky.feed.like`. Uses a `strongRef` to point at the event.
This scatters attendance data across individual repos rather than one
scrapeable list. Full draft in `lexicons/rsvp.json`.

### Comments/discussion
Shipped as Track 2 (anonymous, no atproto record, no account) — plain
SQLite rows on the App View, same trust model as the interest counter.
Not `app.bsky.feed.post` or a new lexicon; a moderator can delete
individual comments but there's no per-comment report step yet.

---

## Stack

**PDS (identity + record storage)**
- Official atproto `pds` Docker image, self-hosted
- Custom lexicons registered for event/rsvp record types

**App View (indexing + serving)**
- Fastify (Node), SQLite (not Postgres — actual build, see Track 2 above)
- v0 reads fan out live to the PDS's own repos; a firehose consumer +
  indexer exist (`appview/src/indexer.js`) and pass their fixtures, but
  stay off (`INDEXER_ENABLED=false`) until `docs/firehose-indexer-spec.md`'s
  trigger condition is hit
- PostGIS/geo queries not built — no map view yet, see MVP scope
- Separate lightweight endpoint(s) for the anonymous interest counter —
  plain DB increment, no atproto involvement

**Frontend**
- SvelteKit — read-heavy, low-JS fits the format
- Map view via Leaflet + OpenStreetMap tiles — not built yet
- Login is currently handle+password against the PDS session API;
  OAuth-via-atproto (the original plan) isn't built yet

**Ops / opsec**
- Hosting jurisdiction chosen deliberately
- No plaintext IP logs tied to event pages or RSVPs
- Tor onion service as an access option (stretch goal, not MVP)
- Moderation: basic report/hide queue for event listings; anonymous counter
  has no moderation tooling by design (soft signal only)

---

## MVP scope (basic features only)

**In scope:**
- Create event (pseudonymous account required)
- View event list + single event page
- RSVP via account (`org.micelio.rsvp`)
- Anonymous "interested" counter (no account)
- Anonymous comments (no account) + basic moderation (report/hide, delete)
- Self-hosted single PDS, no federation with wider atproto network yet
- Query own PDS directly for v0 (skip firehose/App View indexer initially)

**Explicitly out of scope for MVP:**
- Federation with Bluesky/wider atproto network
- Turning the firehose indexer on (built and tested, stays off until its
  documented trigger condition is hit — see `docs/firehose-indexer-spec.md`)
- Map view / geo queries
- Tor onion service
- Real access control for "restricted" events (relies on out-of-band
  channels instead)

---

## Rough timeline (1–2 devs, atproto-new)

| Phase | Work | Time |
|---|---|---|
| 1 | atproto learning curve, PDS stood up, DID/repo CRUD understood | ~1 week |
| 2 | Lexicons finalized, event create + RSVP write path | ~1 week |
| 3 | App View indexer, list/single event views | ~1 week |
| 4 | Map/list UI, OAuth login, deploy, basic moderation | ~1 week |

**~3–4 weeks focused full-time**, ~2–3 months evenings/weekends.

**Fastest path to internal-use MVP:** skip the App View indexer for v0,
query own PDS directly (single point of truth, no firehose complexity).
Compresses "usable by our group" milestone to under 2 weeks.

---

## Open questions / next decisions
- [x] Decide project name — **micelio**, lexicon namespace `org.micelio.*`
- [x] Anti-bot approach for anonymous counter — signed short-lived token from `GET /challenge`
- [ ] Comment/discussion model (reuse bsky posts vs. custom lexicon) — post-MVP
- [ ] Hosting jurisdiction for PDS
- [ ] Moderation policy for event creation (who can post, verification process)
