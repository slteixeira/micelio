# micelio

Decentralized event board for antifascist organizing in São Paulo, built on
atproto. Full design doc: [`PROJECT.md`](./PROJECT.md).

Scaffold status: MVP v0 per PROJECT.md — App View queries the PDS's own
repos directly by default. A firehose indexer exists (`INDEXER_ENABLED`)
but stays off until the scale trigger in
`docs/firehose-indexer-spec.md` is actually hit.

## Layout

- `lexicons/` — `org.micelio.event`, `org.micelio.rsvp` record schemas
- `pds/` — docker-compose for a self-hosted atproto PDS
- `appview/` — Fastify API: reads events straight from the PDS, owns the
  anonymous "interested" counter and moderation (reports/hide, SQLite for
  now). Event/RSVP writes go PDS-direct from the browser, not through
  here — see below.
- `frontend/` — SvelteKit: event list/detail, login, create-event, RSVP,
  report, moderation queue

## Running it

### Local dev (no domain/server needed)

`@atproto/dev-env` boots a real local PDS + PLC in-process — no Docker, no
hostname, no TLS. Use this until you actually have somewhere to host the PDS.

```sh
# 1. Local PDS, seeded with one account + one event, writes appview/.env
cd appview && npm install
npm run dev:pds   # leave running

# 2. App View (separate terminal)
cd appview && npm run dev

# 3. Frontend
cd frontend && cp .env.example .env && pnpm install
pnpm run dev --open
```

`npm run dev:pds` prints the seed account's DID/handle/password, the
event's `at://` URI, and a dev admin token (`dev-admin-token`), and pins
the PDS to `localhost:2583` so `frontend/.env` never needs updating between
restarts. State is in-memory; restarting it wipes and reseeds. Log in at
`/login` with the printed handle/password to create events (`/new`) and
RSVP. Use the printed admin token at `/rizoma-2476` to see reports and
hide/unhide events.

Writes (`createRecord` for events/RSVPs) happen straight from the browser
to the PDS via a logged-in `@atproto/api` session — the App View only
serves reads and the anonymous counter, it doesn't proxy writes.

### Real PDS (once you have a domain)

```sh
cd pds && cp .env.example .env   # fill in PDS_HOSTNAME, secrets, keys
docker compose up -d

cd appview && cp .env.example .env && npm install
npm run dev

cd frontend && cp .env.example .env && pnpm install
pnpm run dev --open
```

## Moderation

Basic report/hide, App View side only — hiding an event never touches its
PDS record, only the author can edit/delete that. `POST /events/:did/:rkey/report`
is anonymous, same soft-signal tradeoff as the interest counter. Hide/unhide
and the `/rizoma-2476/reports` queue are gated by a single shared bearer
token (`APPVIEW_ADMIN_TOKEN`) — no per-moderator identity or audit trail,
deliberately punted per PROJECT.md's open question on moderation policy.

Keep the token in a shared password manager vault, not a chat/DM. Rotate
it (regenerate + restart appview) whenever a moderator leaves the group.

Note: once the public event routes are exposed via Tailscale Funnel,
`/rizoma-2476` is reachable from the open internet too — Funnel exposes the
whole port, not specific paths. The token is the only line of defense.
Decided against splitting moderation onto a tailnet-only port for now —
that would require every moderator to install Tailscale and get invited
to the tailnet, too much onboarding friction for a non-technical mod team.
Revisit if the mod team grows or gets more technical.

## Not done yet

- Real login: current `/login` is handle+password against the PDS session
  API, not OAuth-via-atproto
- Map view, PostGIS geo queries — add once "near me" is actually needed
- Per-moderator identity/audit trail for the admin token — post-MVP,
  fine for a small trusted group for now
- `APPVIEW_ALLOWED_ORIGINS` defaults to local dev origins — set it to the
  real frontend origin before deploying anywhere reachable off localhost

## Anti-bot

The anonymous write endpoints (`/interested`, `/report`, `/comments`) require
a short-lived signed token from `GET /challenge` in the request body's
`challenge` field, on top of the existing per-route rate limits. Same
soft-signal tradeoff as everything else in Track 2 — proves the caller
loaded a page, not an identity or trust signal, and a bot that fetches the
challenge first still gets through.

See `PROJECT.md` → "Open questions" for the rest.
