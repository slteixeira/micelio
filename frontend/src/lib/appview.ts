import { PUBLIC_APPVIEW_URL } from "$env/static/public";

function ensureOk(res: Response) {
  if (!res.ok) throw new Error(res.status === 401 ? "wrong admin token" : "request failed");
}

export async function markInterested(did: string, rkey: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/interested`, {
    method: "POST",
  });
  ensureOk(res);
  return (await res.json()).interested as number;
}

export async function reportEvent(did: string, rkey: string, reason: string) {
  await fetch(`${PUBLIC_APPVIEW_URL}/events/${did}/${rkey}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export async function fetchReportedEvents(token: string) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/moderation/reports`, {
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
