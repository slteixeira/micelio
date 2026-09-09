import { listEvents, getEvent } from "../pds.js";
import { incrementInterest, getInterest } from "../counter.js";
import { addReport, isHidden } from "../moderation.js";
import { addComment, listComments, deleteComment } from "../comments.js";
import { requireAdmin } from "../adminAuth.js";
import { requireChallenge } from "../antibot.js";

async function resolveEvent(req, reply) {
  try {
    return await getEvent(req.params.did, req.params.rkey);
  } catch {
    reply.code(404).send({ error: "event not found" });
    return null;
  }
}

export default async function eventRoutes(app) {
  app.get("/events", async () => {
    const events = await listEvents();
    return events
      .filter((e) => !isHidden(e.uri))
      .map((e) => ({ ...e, interested: getInterest(e.uri) }));
  });

  app.get("/events/:did/:rkey", async (req, reply) => {
    const event = await resolveEvent(req, reply);
    if (!event) return;
    if (isHidden(event.uri)) return reply.code(404).send({ error: "event not found" });
    return { ...event, interested: getInterest(event.uri) };
  });

  // Track 2: anonymous interest counter. No account, no DID, no atproto
  // record — a plain DB increment. Soft/spammable signal by design; the
  // rate limit only bounds scripted volume, it isn't a trust signal.
  app.post(
    "/events/:did/:rkey/interested",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, preHandler: requireChallenge },
    async (req, reply) => {
      const event = await resolveEvent(req, reply);
      if (!event) return;
      const count = incrementInterest(event.uri);
      return reply.send({ interested: count });
    },
  );

  // Anonymous report, same trust model as the interest counter: no
  // account, no dedup. Feeds the moderation queue only.
  app.post(
    "/events/:did/:rkey/report",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } }, preHandler: requireChallenge },
    async (req, reply) => {
      const event = await resolveEvent(req, reply);
      if (!event) return;
      addReport(event.uri, req.body?.reason);
      return reply.send({ ok: true });
    },
  );

  // Track 2: anonymous comments. No account, no DID, no atproto record —
  // same trust model as the interest counter. Spammable by design; a
  // moderator can delete individual comments below.
  app.get("/events/:did/:rkey/comments", async (req, reply) => {
    const event = await resolveEvent(req, reply);
    if (!event) return;
    return listComments(event.uri);
  });

  app.post(
    "/events/:did/:rkey/comments",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } }, preHandler: requireChallenge },
    async (req, reply) => {
      const event = await resolveEvent(req, reply);
      if (!event) return;
      const comment = addComment(event.uri, req.body?.body, req.body?.token);
      if (!comment) return reply.code(400).send({ error: "comment empty or too long" });
      return reply.code(201).send(comment);
    },
  );

  app.delete(
    "/events/:did/:rkey/comments/:id",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const event = await resolveEvent(req, reply);
      if (!event) return;
      const removed = deleteComment(event.uri, Number(req.params.id));
      if (!removed) return reply.code(404).send({ error: "comment not found" });
      return reply.send({ ok: true });
    },
  );
}
