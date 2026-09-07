import { db } from "./db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS interest_counts (
    event_uri TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  )
`);

const bump = db.prepare(`
  INSERT INTO interest_counts (event_uri, count) VALUES (?, 1)
  ON CONFLICT(event_uri) DO UPDATE SET count = count + 1
  RETURNING count
`);

const read = db.prepare(`SELECT count FROM interest_counts WHERE event_uri = ?`);

export function incrementInterest(eventUri) {
  return bump.get(eventUri).count;
}

export function getInterest(eventUri) {
  return read.get(eventUri)?.count ?? 0;
}
