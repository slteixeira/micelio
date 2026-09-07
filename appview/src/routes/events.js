import { listEvents, getEvent } from "../pds.js";
import { incrementInterest, getInterest } from "../counter.js";
import { addReport, isHidden } from "../moderation.js";

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
  // record — a plain DB increment. Soft/spammable signal by design.
  app.post("/events/:did/:rkey/interested", async (req, reply) => {
    const event = await resolveEvent(req, reply);
    if (!event) return;
    const count = incrementInterest(event.uri);
    return reply.send({ interested: count });
  });

  // Anonymous report, same trust model as the interest counter: no
  // account, no dedup, no rate limit. Feeds the moderation queue only.
  app.post("/events/:did/:rkey/report", async (req, reply) => {
    const event = await resolveEvent(req, reply);
    if (!event) return;
    addReport(event.uri, req.body?.reason);
    return reply.send({ ok: true });
  });
}
