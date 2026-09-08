// Single source of truth for every collection this app writes to, and the
// OAuth scope that grants it — shared between the browser OAuth client
// (atproto.svelte.ts) and the hosted client-metadata.json route, so the
// two can't drift out of sync (previously the metadata scope had to be
// hand-copied into a separate deployment file).
export const WRITE_COLLECTIONS = {
  event: "org.micelio.event",
  rsvp: "org.micelio.rsvp",
} as const;

export const OAUTH_SCOPE = [
  "atproto",
  ...Object.values(WRITE_COLLECTIONS).map((collection) => `repo:${collection}?action=create`),
  "blob:image/*", // event image carousel uploads
].join(" ");
