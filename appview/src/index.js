import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import eventRoutes from "./routes/events.js";
import moderationRoutes from "./routes/moderation.js";
import { issueChallenge } from "./antibot.js";

const app = Fastify({ logger: true });

const allowedOrigins = (
  process.env.APPVIEW_ALLOWED_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

await app.register(cors, { origin: allowedOrigins });

// In-memory per-IP counter, never persisted or logged — a floor against
// scripted mass spam on the anonymous write endpoints below, not a real
// identity/trust signal (those stay explicitly spammable per PROJECT.md).
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
app.register(eventRoutes);
app.register(moderationRoutes);

app.get("/health", async () => ({ ok: true }));
app.get("/challenge", async () => issueChallenge());

app.listen({ port: Number(process.env.PORT) || 8080, host: "0.0.0.0" });
