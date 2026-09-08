import { PUBLIC_APPVIEW_URL } from "$env/static/public";
import { error } from "@sveltejs/kit";

export async function load({ fetch, params }) {
  const [res, commentsRes] = await Promise.all([
    fetch(`${PUBLIC_APPVIEW_URL}/events/${params.did}/${params.rkey}`),
    fetch(`${PUBLIC_APPVIEW_URL}/events/${params.did}/${params.rkey}/comments`),
  ]);
  if (!res.ok) error(404, "evento não encontrado");
  return {
    event: await res.json(),
    comments: commentsRes.ok ? await commentsRes.json() : [],
    did: params.did,
    rkey: params.rkey,
  };
}
