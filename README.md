# micelio

Decentralized event board for antifascist organizing in São Paulo, built on
atproto. Full design doc: [`PROJECT.md`](./PROJECT.md).

Scaffold status: MVP v0 per PROJECT.md — no firehose indexer yet, App View
queries the PDS's own repos directly.

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
RSVP. Use the printed admin token at `/moderation` to see reports and
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
and the `/moderation/reports` queue are gated by a single shared bearer
token (`APPVIEW_ADMIN_TOKEN`) — no per-moderator identity or audit trail,
deliberately punted per PROJECT.md's open question on moderation policy.

## Not done yet

- Real login: current `/login` is handle+password against the PDS session
  API, not OAuth-via-atproto
- Map view, PostGIS geo queries — add once "near me" is actually needed
- Anti-bot measure for the anonymous counter and report endpoint (currently
  wide open on both)
- Who holds the admin token / how it's distributed to moderators
- CORS on the App View is `origin: true` (reflects any origin) — fine for
  local dev, lock it to the real frontend origin before deploying

See `PROJECT.md` → "Open questions" for the rest.
