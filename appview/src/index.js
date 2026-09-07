import Fastify from "fastify";
import cors from "@fastify/cors";
import eventRoutes from "./routes/events.js";
import moderationRoutes from "./routes/moderation.js";

const app = Fastify({ logger: true });

// ponytail: wide open for local dev against the frontend's dev origin.
// Lock to the real frontend origin before this goes anywhere near prod.
await app.register(cors, { origin: true });
app.register(eventRoutes);
app.register(moderationRoutes);

app.get("/health", async () => ({ ok: true }));

app.listen({ port: Number(process.env.PORT) || 8080, host: "0.0.0.0" });
