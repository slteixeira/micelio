import { PUBLIC_APPVIEW_URL } from "$env/static/public";
import { error } from "@sveltejs/kit";

export async function load({ fetch, params }) {
  const res = await fetch(`${PUBLIC_APPVIEW_URL}/events/${params.did}/${params.rkey}`);
  if (!res.ok) error(404, "event not found");
  return { event: await res.json(), did: params.did, rkey: params.rkey };
}
