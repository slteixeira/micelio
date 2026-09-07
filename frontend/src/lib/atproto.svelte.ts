import { AtpAgent, type AtpSessionData } from "@atproto/api";
import { browser } from "$app/environment";
import { PUBLIC_PDS_URL } from "$env/static/public";

const SESSION_KEY = "micelio-session";

// $state, not a plain field: every persistSession event (login, logout,
// token refresh) writes here, so any component reading authState.did
// re-renders on its own instead of only on remount.
export const authState = $state<{ did: string | undefined }>({ did: undefined });

export const agent = new AtpAgent({
  service: PUBLIC_PDS_URL,
  persistSession: (_evt, session) => {
    authState.did = session?.did;
    if (!browser) return;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  },
});

if (browser) {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) agent.resumeSession(JSON.parse(raw) as AtpSessionData).catch(() => {});
}

export function rkeyFromUri(uri: string) {
  return uri.split("/").pop()!;
}

export async function login(identifier: string, password: string) {
  await agent.login({ identifier, password });
}

export async function logout() {
  await agent.logout();
}

export async function createEvent(input: {
  title: string;
  description?: string;
  startsAt: string;
  address?: string;
}) {
  if (!agent.session) throw new Error("not logged in");
  return agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "org.micelio.event",
    validate: false,
    record: {
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      location: input.address
        ? { $type: "org.micelio.event#addressLocation", address: input.address }
        : undefined,
      visibility: "public",
      createdAt: new Date().toISOString(),
    },
  });
}

export async function rsvp(event: { uri: string; cid: string }) {
  if (!agent.session) throw new Error("not logged in");
  return agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "org.micelio.rsvp",
    validate: false,
    record: {
      subject: { uri: event.uri, cid: event.cid },
      status: "going",
      createdAt: new Date().toISOString(),
    },
  });
}
