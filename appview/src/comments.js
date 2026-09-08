import { createHash } from "node:crypto";
import { db } from "./db.js";

// Track 2, same trust model as the interest counter and reports: no
// account, no DID, no atproto record — plain rows in the App View's own DB.
// Spammable/abusable by design; cleanup is a moderator delete, not prevention.

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_uri TEXT NOT NULL,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

const insert = db.prepare(
  `INSERT INTO comments (event_uri, name, body, created_at) VALUES (?, ?, ?, ?) RETURNING id, name, body, created_at`,
);
const listStmt = db.prepare(
  `SELECT id, name, body, created_at FROM comments WHERE event_uri = ? ORDER BY id ASC`,
);
const listAllStmt = db.prepare(
  `SELECT id, event_uri, name, body, created_at FROM comments ORDER BY id DESC`,
);
const deleteStmt = db.prepare(`DELETE FROM comments WHERE id = ? AND event_uri = ?`);

const MAX_BODY_LENGTH = 2000;

const ADJECTIVES = [
  "sombrio", "selvagem", "rebelde", "veloz", "invisível", "feroz", "obstinado",
  "insurgente", "errante", "clandestino", "indomável", "implacável", "audaz",
  "subversivo", "vigilante",
];
const NOUNS = [
  "lobo", "corvo", "falcão", "pantera", "cobra", "javali", "coiote", "tubarão",
  "águia", "onça", "escorpião", "víbora", "lince", "urso", "gavião",
];

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Deterministic per (token, event): same browser gets the same name within
// one event's thread, but a different name on another event — the token
// itself is never stored, only this derived name, so there's nothing in the
// DB that links a commenter across events or back to a browser.
export function pseudonymFor(token, eventUri) {
  const hash = createHash("sha256").update(`${token}:${eventUri}`).digest();
  const adjective = ADJECTIVES[hash[0] % ADJECTIVES.length];
  const noun = NOUNS[hash[1] % NOUNS.length];
  const suffix = hash.readUInt16BE(2) % 100;
  return `${noun}${capitalize(adjective)}${suffix}`;
}

export function addComment(eventUri, body, token) {
  const trimmed = String(body ?? "").trim();
  if (!trimmed || trimmed.length > MAX_BODY_LENGTH) return null;
  const name = pseudonymFor(String(token ?? ""), eventUri);
  const row = insert.get(eventUri, name, trimmed, new Date().toISOString());
  return { id: row.id, name: row.name, body: row.body, createdAt: row.created_at };
}

export function listComments(eventUri) {
  return listStmt
    .all(eventUri)
    .map((r) => ({ id: r.id, name: r.name, body: r.body, createdAt: r.created_at }));
}

export function deleteComment(eventUri, id) {
  return deleteStmt.run(id, eventUri).changes > 0;
}

// Moderation queue: every comment across every event, newest first — no
// report step exists for comments (unlike events), so this is how a
// moderator finds abuse at all.
export function listAllComments() {
  return listAllStmt.all().map((r) => ({
    id: r.id,
    eventUri: r.event_uri,
    name: r.name,
    body: r.body,
    createdAt: r.created_at,
  }));
}
