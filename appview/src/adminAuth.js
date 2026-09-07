// Single shared-secret token, no per-moderator identity. Deliberately
// crude — see PROJECT.md open question on moderation policy/verification.
export function requireAdmin(req, reply, done) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token || token !== process.env.APPVIEW_ADMIN_TOKEN) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  done();
}
