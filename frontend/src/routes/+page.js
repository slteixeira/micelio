import { PUBLIC_APPVIEW_URL } from "$env/static/public";

export async function load({ fetch }) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events`);
  const events = res.ok ? await res.json() : [];
  return { events };
}
