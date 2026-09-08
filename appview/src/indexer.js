import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Firehose } from "@atproto/sync";
import { AtpAgent, AtUri } from "@atproto/api";
import { EVENT_COLLECTION, RSVP_COLLECTION } from "./pds.js";
import {
  upsertEvent,
  tombstoneEvent,
  upsertRsvp,
  tombstoneRsvp,
  getCursor,
  setCursor,
} from "./indexerDb.js";

// See docs/firehose-indexer-spec.md for the contract this implements.

function loadLexiconRecordDef(file) {
  const path = fileURLToPath(new URL(`../../lexicons/${file}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")).defs.main.record;
}

const EVENT_DEF = loadLexiconRecordDef("event.json");
const RSVP_DEF = loadLexiconRecordDef("rsvp.json");

// Minimal lexicon check driven by the lexicon file itself (required fields +
// knownValues enums) rather than a hand-duplicated field list — one source
// of truth, and it can't drift from the actual lexicon.
export function validateRecord(record, def) {
  for (const field of def.required || []) {
    if (record[field] === undefined || record[field] === null) {
      return `missing required field "${field}"`;
    }
  }
  for (const [key, prop] of Object.entries(def.properties || {})) {
    if (prop.knownValues && record[key] !== undefined && !prop.knownValues.includes(record[key])) {
      return `field "${key}" has unknown value "${record[key]}"`;
    }
  }
  return null;
}

function logSkip(collection, did, rkey, seq, reason) {
  console.error(`[indexer] skipping ${collection} ${did}/${rkey} (seq=${seq}): ${reason}`);
}

// Applies one record write (create or update — both are upserts) or a
// delete (tombstone). Used identically by backfill and by the live stream,
// so redelivery/backfill-overlap is always idempotent by construction.
export function applyEventWrite({ did, rkey, cid, action, record, seq }) {
  if (action === "delete") return tombstoneEvent(did, rkey);
  const err = validateRecord(record, EVENT_DEF);
  if (err) return logSkip(EVENT_COLLECTION, did, rkey, seq, err);
  upsertEvent(did, rkey, cid, record);
}

export function applyRsvpWrite({ did, rkey, cid, action, record, seq }) {
  if (action === "delete") return tombstoneRsvp(did, rkey);
  const err = validateRecord(record, RSVP_DEF);
  if (err) return logSkip(RSVP_COLLECTION, did, rkey, seq, err);
  upsertRsvp(did, rkey, record.subject?.uri, record.status || "going", record);
}

// Dispatches one already-parsed firehose commit event (see @atproto/sync's
// CommitEvt) to the right collection handler, then persists its seq as the
// new cursor. Also the shape backfill-replay of buffered live events uses.
export function processCommit(evt) {
  const write = {
    did: evt.did,
    rkey: evt.rkey,
    cid: evt.cid?.toString(),
    action: evt.event,
    record: evt.record,
    seq: evt.seq,
  };
  if (evt.collection === EVENT_COLLECTION) applyEventWrite(write);
  else if (evt.collection === RSVP_COLLECTION) applyRsvpWrite(write);
  setCursor(evt.seq);
}

async function walkCollection(agent, collection, onRecord) {
  const { data } = await agent.com.atproto.sync.listRepos({});
  for (const repo of data.repos) {
    let cursor;
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: repo.did,
        collection,
        cursor,
      });
      for (const record of res.data.records) {
        const { rkey } = new AtUri(record.uri);
        onRecord(repo.did, rkey, record.cid, record.value);
      }
      cursor = res.data.cursor;
    } while (cursor);
  }
}

async function backfill(agent) {
  await walkCollection(agent, EVENT_COLLECTION, (did, rkey, cid, record) => {
    applyEventWrite({ did, rkey, cid, action: "create", record, seq: "backfill" });
  });
  await walkCollection(agent, RSVP_COLLECTION, (did, rkey, cid, record) => {
    applyRsvpWrite({ did, rkey, cid, action: "create", record, seq: "backfill" });
  });
}

// Consumer entrypoint (run via scripts/indexer.js). No stored cursor means
// first run: subscribe live (buffering commits instead of applying them),
// backfill every existing repo via listRecords, then drain the buffer in
// order. This is what keeps writes that land during backfill from being
// lost — see "Backfill vs. live boundary" in the spec.
export async function runIndexer({ service = process.env.PDS_URL } = {}) {
  let backfilling = getCursor() === undefined;
  const buffer = [];
  let lastSeenSeq;

  const firehose = new Firehose({
    service,
    idResolver: null, // never dereferenced: unauthenticatedCommits + identity/account/sync excluded below
    unauthenticatedCommits: true,
    excludeIdentity: true,
    excludeAccount: true,
    excludeSync: true,
    filterCollections: [EVENT_COLLECTION, RSVP_COLLECTION],
    // While backfilling, resume from the last commit actually seen (not the
    // persisted cursor, which only advances once buffered events drain) so
    // a reconnect mid-backfill can't silently skip commits.
    getCursor: () => (backfilling ? lastSeenSeq : getCursor()),
    handleEvent: (evt) => {
      lastSeenSeq = evt.seq;
      if (backfilling) buffer.push(evt);
      else processCommit(evt);
    },
    onError: (err) => console.error("[indexer] firehose error", err),
  });

  firehose.start();

  if (backfilling) {
    const agent = new AtpAgent({ service });
    await backfill(agent);
    backfilling = false;
    for (const evt of buffer.splice(0)) processCommit(evt);
  }

  return firehose;
}
