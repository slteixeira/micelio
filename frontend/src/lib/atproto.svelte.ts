import { Agent } from "@atproto/api";
import { BrowserOAuthClient, type OAuthSession } from "@atproto/oauth-client-browser";
import { buildAtprotoLoopbackClientMetadata } from "@atproto/oauth-types";
import { browser } from "$app/environment";
import { PUBLIC_PDS_URL, PUBLIC_OAUTH_CLIENT_ID, PUBLIC_PLC_URL } from "$env/static/public";
import { WRITE_COLLECTIONS, OAUTH_SCOPE } from "$lib/oauthScope";

// $state, not a plain field: every login/logout/session-invalidation
// writes here, so any component reading authState.did re-renders on its
// own instead of only on remount.
export const authState = $state<{ did: string | undefined }>({ did: undefined });

// Handle and PDS host for the identity rule (README 1a). Populated
// asynchronously after login — handle needs a describeRepo round-trip,
// so it briefly lags did.
export const profileState = $state<{ handle: string | undefined; pdsHost: string | undefined }>({
  handle: undefined,
  pdsHost: undefined,
});

let client: BrowserOAuthClient | undefined;
let session: OAuthSession | undefined;
let agent: Agent | undefined;

async function getClient() {
  if (client) return client;
  const common = {
    handleResolver: PUBLIC_PDS_URL,
    // Empty in production — defaults to the real https://plc.directory.
    // Set only for a local dev-env PLC (dev-pds.js pins its port).
    ...(PUBLIC_PLC_URL ? { plcDirectoryUrl: PUBLIC_PLC_URL } : {}),
  };
  client = PUBLIC_OAUTH_CLIENT_ID
    ? await BrowserOAuthClient.load({ clientId: PUBLIC_OAUTH_CLIENT_ID, ...common })
    : // Loopback client: no hosted client-metadata.json needed. Must
      // browse via http://127.0.0.1:<port>, NOT localhost (the library's
      // own location-derived default breaks off the root path; this
      // config-based builder doesn't). The default redirect_uris omit a
      // port entirely (used only for "does this match the current page"
      // checks elsewhere) — the actual redirect_uri sent to the PDS is
      // taken from this array verbatim, so the real port must be spelled
      // out here or the callback lands on port 80. Dev-only; a real
      // deployment needs PUBLIC_OAUTH_CLIENT_ID pointing at a hosted
      // client-metadata.json.
      new BrowserOAuthClient({
        ...common,
        // Local dev-env PDS/PLC are plain HTTP — refused by default.
        allowHttp: true,
        clientMetadata: buildAtprotoLoopbackClientMetadata({
          redirect_uris: [`http://127.0.0.1:${window.location.port}/`],
          scope: OAUTH_SCOPE,
        }),
      });
  return client;
}

function setSession(next: OAuthSession | undefined) {
  session = next;
  agent = next ? new Agent(next) : undefined;
  authState.did = next?.did;
  profileState.handle = undefined;
  profileState.pdsHost = next ? new URL(next.serverMetadata.issuer).host : undefined;
  if (next) {
    agent!.com.atproto.repo
      .describeRepo({ repo: next.did })
      .then((res) => (profileState.handle = res.data.handle))
      .catch(() => {});
  }
}

if (browser) {
  getClient().then(async (c) => {
    const result = await c.init();
    if (result) setSession(result.session);
  });
}

export function rkeyFromUri(uri: string) {
  return uri.split("/").pop()!;
}

export function didFromUri(uri: string) {
  return uri.split("/")[2];
}

// Single source of truth for turning a caught error into displayable text
// — the PDS/App View error is shown verbatim when there is one, our own
// fallback copy otherwise. Used by every route that catches a write/fetch
// failure.
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function login(handleOrDid: string) {
  const c = await getClient();
  await c.signInRedirect(handleOrDid); // never resolves — navigates away
}

export async function logout() {
  await session?.signOut();
  setSession(undefined);
}

export const MAX_EVENT_IMAGES = 4;

export async function createEvent(input: {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  address?: string;
  images?: File[];
}) {
  if (!agent) throw new Error("não está logado");
  const files = (input.images ?? []).slice(0, MAX_EVENT_IMAGES);
  const uploaded = await Promise.all(
    files.map((file) =>
      agent!.com.atproto.repo
        .uploadBlob(file, { encoding: file.type })
        .then((res) => ({ image: res.data.blob, alt: "" })),
    ),
  );
  return agent.com.atproto.repo.createRecord({
    repo: agent.did!,
    collection: WRITE_COLLECTIONS.event,
    validate: false,
    record: {
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.address
        ? { $type: "org.micelio.event#addressLocation", address: input.address }
        : undefined,
      images: uploaded.length ? uploaded : undefined,
      visibility: "public",
      createdAt: new Date().toISOString(),
    },
  });
}

// Blobs live on the event author's PDS. v0 is single-PDS (PROJECT.md MVP
// scope — no federation yet), so PUBLIC_PDS_URL always resolves them.
export function blobUrl(did: string, cid: string) {
  return `${PUBLIC_PDS_URL}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
}

export async function rsvp(event: { uri: string; cid: string }) {
  if (!agent) throw new Error("não está logado");
  return agent.com.atproto.repo.createRecord({
    repo: agent.did!,
    collection: WRITE_COLLECTIONS.rsvp,
    validate: false,
    record: {
      subject: { uri: event.uri, cid: event.cid },
      status: "going",
      createdAt: new Date().toISOString(),
    },
  });
}

// Shared "going" click state — the feed card and the detail page each
// render this differently (different Stamp variant once confirmed,
// different error placement), but both need the same going/error state
// plus the same rsvp() try/catch. One factory, two independent instances.
export function createGoingState(event: { uri: string; cid: string }) {
  const state = $state({ going: false, error: "" });
  async function click() {
    state.error = "";
    try {
      await rsvp(event);
      state.going = true;
    } catch (err) {
      state.error = errorMessage(err, "falha ao confirmar presença");
    }
  }
  return { state, click };
}
