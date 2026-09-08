import { test } from "node:test";
import assert from "node:assert/strict";

// Ephemeral DB per test run — must be set before indexerDb.js's static
// `import { db }` resolves, so these imports have to be dynamic.
process.env.COUNTER_DB_PATH = ":memory:";
process.env.EVENT_COLLECTION = "org.micelio.event";
process.env.RSVP_COLLECTION = "org.micelio.rsvp";
process.env.PDS_URL = "http://localhost:0";

const { processCommit, applyEventWrite, applyRsvpWrite } = await import("../src/indexer.js");
const { listIndexedEvents, listIndexedRsvpsForSubject, getCursor } = await import(
  "../src/indexerDb.js"
);

const event = (overrides = {}) => ({
  did: "did:example:alice",
  rkey: "3jzfcijpj2z2a",
  cid: "bafyone",
  action: "create",
  seq: 1,
  record: { title: "Assembleia", startsAt: "2026-01-01T00:00:00Z", createdAt: "2026-01-01T00:00:00Z" },
  ...overrides,
});

test("fixture_create_update_delete", () => {
  applyEventWrite(event());
  applyEventWrite(event({ action: "update", seq: 2, record: { ...event().record, title: "Updated" } }));
  applyEventWrite(event({ action: "delete", seq: 3 }));

  const rows = listIndexedEvents();
  assert.equal(rows.length, 0, "tombstoned rows are excluded from listing");
});

test("fixture_restart_mid_backfill (idempotent re-walk)", () => {
  applyEventWrite(event({ rkey: "restart1" }));
  applyEventWrite(event({ rkey: "restart1" })); // simulated re-walk of the same repo after a crash

  const rows = listIndexedEvents().filter((e) => e.rkey === "restart1");
  assert.equal(rows.length, 1, "no duplicate row from re-processing the same record");
});

test("fixture_redelivery", () => {
  const evt = { did: "did:example:bob", rkey: "redeliver1", collection: "org.micelio.event", event: "create", seq: 10, cid: { toString: () => "bafyredeliver" }, record: event().record };
  processCommit(evt);
  processCommit(evt); // simulated reconnect replay of the exact same commit

  const rows = listIndexedEvents().filter((e) => e.rkey === "redeliver1");
  assert.equal(rows.length, 1);
  assert.equal(getCursor(), 10);
});

test("fixture_malformed_record", () => {
  applyEventWrite(event({ rkey: "malformed1", record: { title: "No start date" } })); // missing startsAt
  applyEventWrite(event({ rkey: "valid-after-malformed" })); // consumer keeps going

  const rows = listIndexedEvents();
  assert.ok(!rows.some((e) => e.rkey === "malformed1"), "malformed record is skipped, not indexed");
  assert.ok(rows.some((e) => e.rkey === "valid-after-malformed"), "subsequent valid commit still processed");
});

test("fixture_rsvp_subject_ref", () => {
  const eventDid = "did:example:organizer";
  const eventRkey = "theevent";
  applyEventWrite(event({ did: eventDid, rkey: eventRkey }));

  const subjectUri = `at://${eventDid}/org.micelio.event/${eventRkey}`;
  applyRsvpWrite({
    did: "did:example:attendee",
    rkey: "rsvp1",
    cid: "bafyrsvp",
    action: "create",
    seq: 20,
    record: { subject: { uri: subjectUri, cid: "bafyone" }, status: "going", createdAt: "2026-01-01T00:00:00Z" },
  });

  const rsvps = listIndexedRsvpsForSubject(subjectUri);
  assert.equal(rsvps.length, 1);
  assert.equal(rsvps[0].status, "going");
  assert.ok(listIndexedEvents().some((e) => e.uri === subjectUri), "joinable against indexed_events");
});

test("fixture_reconnect_gap (cursor advances across a gap)", () => {
  processCommit({ did: "did:example:carol", rkey: "gap1", collection: "org.micelio.event", event: "create", seq: 30, cid: { toString: () => "c1" }, record: event().record });
  // simulated gap: consumer was down, then reconnects and firehose redelivers from the stored cursor
  processCommit({ did: "did:example:carol", rkey: "gap2", collection: "org.micelio.event", event: "create", seq: 31, cid: { toString: () => "c2" }, record: event().record });

  assert.equal(getCursor(), 31);
  const rkeys = listIndexedEvents().map((e) => e.rkey);
  assert.ok(rkeys.includes("gap1") && rkeys.includes("gap2"), "both pre- and post-gap writes indexed");
});
