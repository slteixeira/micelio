import { PUBLIC_APPVIEW_URL } from "$env/static/public";

function ensureOk(res: Response) {
  if (res.ok) return;
  if (res.status === 401) throw new Error("token de administrador incorreto");
  if (res.status === 429) throw new Error("muitas tentativas · espera um pouco e tenta de novo");
  throw new Error("falha na requisição");
}

// Cached in memory only, per PROJECT.md's anti-bot plan: a short-lived
// signed token the appview issues, proving the caller at least loaded a
// page — not an identity or trust signal, just raises the floor above a
// blind scripted POST. Refetched whenever expired.
let cachedChallenge: { token: string; expiresAt: number } | null = null;

async function getChallenge() {
  if (cachedChallenge && cachedChallenge.expiresAt > Date.now() + 5000) {
    return cachedChallenge.token;
  }
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/challenge`);
  ensureOk(res);
  cachedChallenge = await res.json();
  return cachedChallenge!.token;
}

export async function markInterested(did: string, rkey: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/interested`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge: await getChallenge() }),
  });
  ensureOk(res);
  return (await res.json()).interested as number;
}

export async function reportEvent(did: string, rkey: string, reason: string) {
  await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, challenge: await getChallenge() }),
  });
}

export async function fetchComments(did: string, rkey: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/comments`);
  ensureOk(res);
  return res.json();
}

// One random token per event per browser, kept only in localStorage — the
// appview hashes it with the event URI into a display name and never
// stores the token itself, so it can't link a commenter across events.
function commenterToken(did: string, rkey: string) {
  const key = `micelio-commenter-token:${did}/${rkey}`;
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

export async function postComment(did: string, rkey: string, body: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, token: commenterToken(did, rkey), challenge: await getChallenge() }),
  });
  ensureOk(res);
  return res.json();
}

export async function fetchReportedEvents(token: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/rizoma-2476/reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  ensureOk(res);
  return res.json();
}

export async function setEventHidden(did: string, rkey: string, hidden: boolean, token: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/hidden`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ hidden }),
  });
  ensureOk(res);
}

export async function fetchAllComments(token: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/rizoma-2476/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  ensureOk(res);
  return res.json();
}

export async function deleteComment(did: string, rkey: string, id: number, token: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/comments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  ensureOk(res);
}
