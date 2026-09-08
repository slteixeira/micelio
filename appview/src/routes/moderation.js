import { AtUri } from "@atproto/api";
import { getEvent, eventUri } from "../pds.js";
import { hideEvent, unhideEvent, listReportedEvents, isHidden } from "../moderation.js";
import { getInterest } from "../counter.js";
import { requireAdmin } from "../adminAuth.js";
import { listAllComments } from "../comments.js";

export default async function moderationRoutes(app) {
  // No PDS round-trip needed: hiding is keyed by URI, which is derivable
  // from did+rkey directly — it doesn't require confirming the record
  // still exists (moderators only ever hide events they just saw in the
  // reports queue, which already fetched them from the PDS).
  app.post("/events/:did/:rkey/hidden", { preHandler: requireAdmin }, async (req, reply) => {
    const uri = eventUri(req.params.did, req.params.rkey);
    if (req.body?.hidden) hideEvent(uri);
    else unhideEvent(uri);
    return reply.send({ ok: true });
  });

  // Bypasses the hidden-event filter on purpose — this is where a
  // moderator looks at exactly the events flagged and/or already hidden.
  app.get("/moderation/reports", { preHandler: requireAdmin }, async () => {
    const reported = listReportedEvents();
    const events = await Promise.all(
      reported.map(async (r) => {
        const uri = new AtUri(r.event_uri);
        try {
          const event = await getEvent(uri.hostname, uri.rkey);
          return {
            ...event,
            interested: getInterest(event.uri),
            hidden: isHidden(event.uri),
            reportCount: r.count,
            reasons: r.reasons,
          };
        } catch {
          return { uri: r.event_uri, deleted: true, reportCount: r.count, reasons: r.reasons };
        }
      }),
    );
    return events;
  });

  // No report step for comments (unlike events) — this is the only way a
  // moderator finds abuse. Event titles are resolved per comment, cached
  // per-request since many comments usually share one event.
  app.get("/moderation/comments", { preHandler: requireAdmin }, async () => {
    const comments = listAllComments();
    const eventCache = new Map();
    return Promise.all(
      comments.map(async (c) => {
        if (!eventCache.has(c.eventUri)) {
          const uri = new AtUri(c.eventUri);
          eventCache.set(
            c.eventUri,
            getEvent(uri.hostname, uri.rkey).catch(() => null),
          );
        }
        const event = await eventCache.get(c.eventUri);
        return { ...c, eventTitle: event?.title ?? null };
      }),
    );
  });
}
