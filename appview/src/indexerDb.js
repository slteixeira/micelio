import { AtUri } from "@atproto/api";
import { db } from "./db.js";

const EVENT_COLLECTION = process.env.EVENT_COLLECTION;

// Own tables, separate from moderation state (see docs/firehose-indexer-spec.md).
// `cid` on indexed_events isn't in the spec's schema sketch but the frontend
// needs the record's current cid to build an rsvp strongRef — see
// frontend/src/lib/atproto.svelte.ts.

db.exec(`
  CREATE TABLE IF NOT EXISTS indexed_events (
    did TEXT NOT NULL,
    rkey TEXT NOT NULL,
    cid TEXT NOT NULL,
    record TEXT NOT NULL,
    indexed_at TEXT NOT NULL,
    tombstoned_at TEXT,
    PRIMARY KEY (did, rkey)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS indexed_rsvps (
    did TEXT NOT NULL,
    rkey TEXT NOT NULL,
    subject_uri TEXT NOT NULL,
    status TEXT NOT NULL,
    record TEXT NOT NULL,
    indexed_at TEXT NOT NULL,
    tombstoned_at TEXT,
    PRIMARY KEY (did, rkey)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS indexer_cursor (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    seq INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

const upsertEventStmt = db.prepare(`
  INSERT INTO indexed_events (did, rkey, cid, record, indexed_at, tombstoned_at)
  VALUES (?, ?, ?, ?, ?, NULL)
  ON CONFLICT(did, rkey) DO UPDATE SET
    cid = excluded.cid,
    record = excluded.record,
    indexed_at = excluded.indexed_at,
    tombstoned_at = NULL
`);
const tombstoneEventStmt = db.prepare(
  `UPDATE indexed_events SET tombstoned_at = ? WHERE did = ? AND rkey = ?`,
);
const listEventsStmt = db.prepare(
  `SELECT did, rkey, cid, record FROM indexed_events WHERE tombstoned_at IS NULL`,
);
const getEventStmt = db.prepare(
  `SELECT did, rkey, cid, record FROM indexed_events WHERE did = ? AND rkey = ? AND tombstoned_at IS NULL`,
);

const upsertRsvpStmt = db.prepare(`
  INSERT INTO indexed_rsvps (did, rkey, subject_uri, status, record, indexed_at, tombstoned_at)
  VALUES (?, ?, ?, ?, ?, ?, NULL)
  ON CONFLICT(did, rkey) DO UPDATE SET
    subject_uri = excluded.subject_uri,
    status = excluded.status,
    record = excluded.record,
    indexed_at = excluded.indexed_at,
    tombstoned_at = NULL
`);
const tombstoneRsvpStmt = db.prepare(
  `UPDATE indexed_rsvps SET tombstoned_at = ? WHERE did = ? AND rkey = ?`,
);
const listRsvpsForSubjectStmt = db.prepare(
  `SELECT did, rkey, status, record FROM indexed_rsvps WHERE subject_uri = ? AND tombstoned_at IS NULL`,
);
const countGoingBySubjectStmt = db.prepare(`
  SELECT subject_uri, COUNT(*) AS count FROM indexed_rsvps
  WHERE status = 'going' AND tombstoned_at IS NULL
  GROUP BY subject_uri
`);

const getCursorStmt = db.prepare(`SELECT seq FROM indexer_cursor WHERE id = 1`);
const setCursorStmt = db.prepare(`
  INSERT INTO indexer_cursor (id, seq, updated_at) VALUES (1, ?, ?)
  ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, updated_at = excluded.updated_at
`);

function rowToEvent(row) {
  return {
    uri: AtUri.make(row.did, EVENT_COLLECTION, row.rkey).toString(),
    did: row.did,
    rkey: row.rkey,
    cid: row.cid,
    ...JSON.parse(row.record),
  };
}

export function upsertEvent(did, rkey, cid, record) {
  upsertEventStmt.run(did, rkey, cid, JSON.stringify(record), new Date().toISOString());
}

export function tombstoneEvent(did, rkey) {
  tombstoneEventStmt.run(new Date().toISOString(), did, rkey);
}

export function listIndexedEvents() {
  return listEventsStmt.all().map(rowToEvent);
}

export function getIndexedEvent(did, rkey) {
  const row = getEventStmt.get(did, rkey);
  return row ? rowToEvent(row) : undefined;
}

export function upsertRsvp(did, rkey, subjectUri, status, record) {
  upsertRsvpStmt.run(
    did,
    rkey,
    subjectUri,
    status,
    JSON.stringify(record),
    new Date().toISOString(),
  );
}

export function tombstoneRsvp(did, rkey) {
  tombstoneRsvpStmt.run(new Date().toISOString(), did, rkey);
}

export function listIndexedRsvpsForSubject(subjectUri) {
  return listRsvpsForSubjectStmt
    .all(subjectUri)
    .map((r) => ({ did: r.did, rkey: r.rkey, status: r.status, ...JSON.parse(r.record) }));
}

export function countGoingBySubject() {
  const counts = new Map();
  for (const row of countGoingBySubjectStmt.all()) counts.set(row.subject_uri, row.count);
  return counts;
}

export function getCursor() {
  return getCursorStmt.get()?.seq;
}

export function setCursor(seq) {
  setCursorStmt.run(seq, new Date().toISOString());
}
