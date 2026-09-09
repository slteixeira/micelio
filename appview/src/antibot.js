import { createHmac, randomBytes } from "node:crypto";

// Per PROJECT.md: "Optional lightweight anti-bot measure (short-lived
// signed token...) — accepted as a soft, spammable signal, not a trust
// signal." Raises the floor above a blind scripted POST without requiring
// an account; a bot that bothers to fetch /challenge first still gets
// through, same tradeoff as the rate limits next to it.

const secret = randomBytes(32);
const TTL_MS = 5 * 60 * 1000;

export function issueChallenge() {
  const issuedAt = Date.now();
  const sig = createHmac("sha256", secret).update(String(issuedAt)).digest("hex");
  return { token: `${issuedAt}.${sig}`, expiresAt: issuedAt + TTL_MS };
}

export function verifyChallenge(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [issuedAtStr, sig] = token.split(".");
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > TTL_MS) return false;
  const expected = createHmac("sha256", secret).update(issuedAtStr).digest("hex");
  return sig === expected;
}

export function requireChallenge(req, reply, done) {
  if (!verifyChallenge(req.body?.challenge)) {
    reply.code(403).send({ error: "missing or expired challenge, GET /challenge and retry" });
    return;
  }
  done();
}
