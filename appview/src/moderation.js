import { db } from "./db.js";

// Moderation lives entirely here, App View side. Hiding an event never
// touches the PDS record — only the author can edit/delete that. Hiding
// just means the App View stops serving it.

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_uri TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS hidden_events (
    event_uri TEXT PRIMARY KEY,
    hidden_at TEXT NOT NULL
  )
`);

const insertReport = db.prepare(
  `INSERT INTO reports (event_uri, reason, created_at) VALUES (?, ?, ?)`,
);
const hideStmt = db.prepare(
  `INSERT OR REPLACE INTO hidden_events (event_uri, hidden_at) VALUES (?, ?)`,
);
const unhideStmt = db.prepare(`DELETE FROM hidden_events WHERE event_uri = ?`);
const isHiddenStmt = db.prepare(`SELECT 1 FROM hidden_events WHERE event_uri = ?`);
const reportedEventsStmt = db.prepare(`
  SELECT event_uri, COUNT(*) as count, GROUP_CONCAT(reason, ' | ') as reasons
  FROM reports
  GROUP BY event_uri
  ORDER BY count DESC
`);

export function addReport(eventUri, reason) {
  insertReport.run(eventUri, reason || null, new Date().toISOString());
}

export function hideEvent(eventUri) {
  hideStmt.run(eventUri, new Date().toISOString());
}

export function unhideEvent(eventUri) {
  unhideStmt.run(eventUri);
}

export function isHidden(eventUri) {
  return Boolean(isHiddenStmt.get(eventUri));
}

export function listReportedEvents() {
  return reportedEventsStmt.all();
}
