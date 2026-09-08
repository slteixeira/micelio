import { json } from "@sveltejs/kit";
import { OAUTH_SCOPE } from "$lib/oauthScope";

// Served at /client-metadata.json — set PUBLIC_OAUTH_CLIENT_ID to this
// route's full URL for a real (non-loopback) deployment. Scope is derived
// from the same WRITE_COLLECTIONS the app actually writes to (see
// $lib/oauthScope), so this can't drift out of sync with what the code
// requests like a hand-maintained static file would.
export function GET({ url }) {
  const origin = url.origin;
  return json({
    client_id: `${origin}/client-metadata.json`,
    client_name: "micelio",
    client_uri: origin,
    redirect_uris: [`${origin}/`],
    scope: OAUTH_SCOPE,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
  });
}
