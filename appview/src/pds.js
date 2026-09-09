import { AtpAgent, AtUri } from "@atproto/api";

const agent = new AtpAgent({ service: process.env.PDS_URL });
export const EVENT_COLLECTION = process.env.EVENT_COLLECTION;
export const RSVP_COLLECTION = process.env.RSVP_COLLECTION;

export function eventUri(did, rkey) {
  return AtUri.make(did, EVENT_COLLECTION, rkey).toString();
}

// v0 fanout: no firehose/App View indexer running by default (see
// PROJECT.md MVP scope + docs/firehose-indexer-spec.md). Every read walks
// the PDS's own repos directly instead of the indexer DB.
// ponytail: O(repos) fanout per request, fine for a single self-hosted PDS
// with a handful of organizers. Set INDEXER_ENABLED=true once the indexer
// (src/indexer.js) is running to read from its DB instead — kept behind
// this flag for one release per the spec's rollback plan.

const INDEXER_ENABLED = process.env.INDEXER_ENABLED === "true";

function toEvent({ uri, cid, value }, did) {
  return { uri, cid, authorDid: did, ...value };
}

async function listEventsFromPds() {
  const { data } = await agent.com.atproto.sync.listRepos({});
  const events = [];

  for (const repo of data.repos) {
    let cursor;
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: repo.did,
        collection: EVENT_COLLECTION,
        cursor,
      });
      for (const record of res.data.records) {
        events.push(toEvent(record, repo.did));
      }
      cursor = res.data.cursor;
    } while (cursor);
  }

  return events;
}

async function getEventFromPds(did, rkey) {
  const { data } = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: EVENT_COLLECTION,
    rkey,
  });
  return toEvent(data, did);
}

function fromIndexRow({ did, rkey, cid, uri, ...record }) {
  return { uri, cid, authorDid: did, ...record };
}

export async function listEvents() {
  const events = INDEXER_ENABLED
    ? (await import("./indexerDb.js")).listIndexedEvents().map(fromIndexRow)
    : await listEventsFromPds();

  events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  return events;
}

// "going" counts, honestly: RSVPs live in each attendee's own repo, never
// the event's, so this is the same O(repos) fanout as listEvents() rather
// than a cheap lookup — acceptable at this scale (see pds.js top comment).
async function goingCountsFromPds() {
  const { data } = await agent.com.atproto.sync.listRepos({});
  const counts = new Map();

  for (const repo of data.repos) {
    let cursor;
    do {
      const res = await agent.com.atproto.repo.listRecords({
        repo: repo.did,
        collection: RSVP_COLLECTION,
        cursor,
      });
      for (const { value } of res.data.records) {
        if (value.status !== "going" || !value.subject?.uri) continue;
        counts.set(value.subject.uri, (counts.get(value.subject.uri) ?? 0) + 1);
      }
      cursor = res.data.cursor;
    } while (cursor);
  }

  return counts;
}

export async function getGoingCounts() {
  if (INDEXER_ENABLED) {
    const { countGoingBySubject } = await import("./indexerDb.js");
    return countGoingBySubject();
  }
  return goingCountsFromPds();
}

export async function getEvent(did, rkey) {
  if (INDEXER_ENABLED) {
    const { getIndexedEvent } = await import("./indexerDb.js");
    const row = getIndexedEvent(did, rkey);
    if (!row) throw new Error("event not found");
    return fromIndexRow(row);
  }
  return getEventFromPds(did, rkey);
}
