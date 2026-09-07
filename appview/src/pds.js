import { AtpAgent, AtUri } from "@atproto/api";

const agent = new AtpAgent({ service: process.env.PDS_URL });
export const EVENT_COLLECTION = process.env.EVENT_COLLECTION;

export function eventUri(did, rkey) {
  return AtUri.make(did, EVENT_COLLECTION, rkey).toString();
}

// v0: no firehose/App View indexer yet (see PROJECT.md MVP scope). Every
// read walks the PDS's own repos directly instead of a Postgres index.
// ponytail: O(repos) fanout per request, fine for a single self-hosted PDS
// with a handful of organizers. Add the firehose indexer before this scales.

function toEvent({ uri, cid, value }, did) {
  return { uri, cid, authorDid: did, ...value };
}

export async function listEvents() {
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

  events.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  return events;
}

export async function getEvent(did, rkey) {
  const { data } = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: EVENT_COLLECTION,
    rkey,
  });
  return toEvent(data, did);
}
