# micelio — decentralized event board for antifascist organizing in São Paulo

## What this is

A "Facebook Events, but decentralized" tool for publishing and coordinating
antifascist organizing events in São Paulo. Built on the AT Protocol
(atproto) for the public event listing layer, with a pseudonymous-by-default
identity model and a separate zero-identity path for low-stakes engagement.

Not a general-purpose imageboard, not a Mobilizon fork — a narrow, purpose-built
tool for one use case: publish an event, let people signal attendance, resist
a single point of takedown.

---

## Why atproto (and not ActivityPub / plain P2P)

Considered three approaches:

| Approach | Identity model | Maturity for this use case | Verdict |
|---|---|---|---|
| ActivityPub (Mobilizon) | Tied to home instance | Mature, deployable today | Good fallback, less resilient identity |
| Full P2P (libp2p/CRDT) | Self-sovereign | Hard discoverability, high build cost | Overkill for MVP |
| **atproto** | **DID-based, portable across PDS** | **Immature ecosystem, but strong identity guarantees** | **Chosen** |

The deciding factor: atproto decouples identity (DID) from the server hosting
it. If a PDS gets pressured or taken down, a user's identity and repo can
migrate elsewhere without losing history. That's a meaningfully better
threat model for this specific use case than ActivityPub's instance-bound
identity.

**Tradeoff accepted:** no existing "Mobilizon of atproto" — the lexicon,
PDS customization, and App View are being built from scratch.

---

## Identity model: pseudonymous accounts + anonymous counter

atproto has no anonymous-write primitive — every record is signed by a DID
keypair. Full anonymity and atproto pull in different directions. Resolved
as a two-track split:

### Track 1 — Pseudonymous atproto accounts
- For organizers and anyone who wants a persistent (but not real-name)
  identity
- Handles are throwaway-style (`maria9284.yourpds.org`) — no phone/email/
  real name required
- Required for: creating events, "official" RSVPs with attendance history

### Track 2 — Anonymous interest counter
- No account, no DID, no atproto record at all
- Plain HTTP endpoint on the App View: `POST /events/:id/interested`
- Increments a Postgres counter; no long-term session/IP linkage
- Optional lightweight anti-bot measure (short-lived signed token or
  client-side PoW challenge) — accepted as a soft, spammable signal, not
  a trust signal

Event pages display both numbers separately and labeled, so users understand
which is cryptographically attributable vs. a vibe-check.

**Important constraint:** atproto records are public-by-default once
federated. `visibility: restricted` on an event is a soft UI hint only,
**not real access control**. Sensitive event details (precise time/location
for higher-risk actions) should not go in the public record — use an
out-of-band encrypted channel (Signal) and treat the atproto record as a
public pointer only, if it exists at all.

---

## Lexicons

### `org.micelio.event`
Event record — title, description, start/end time, location (geo, address,
or online), cover image, visibility hint. Full draft in `lexicons/event.json`.

### `org.micelio.rsvp`
Attendance record, stored **in the attendee's own repo** (not the event's),
mirroring `app.bsky.feed.like`. Uses a `strongRef` to point at the event.
This scatters attendance data across individual repos rather than one
scrapeable list. Full draft in `lexicons/rsvp.json`.

### Comments/discussion
Deferred — likely reuse `app.bsky.feed.post` with a reply-style ref, or a
dedicated `org.micelio.comment` if full separation from Bluesky's graph
is wanted. Not required for MVP.

---

## Stack

**PDS (identity + record storage)**
- Official atproto `pds` Docker image, self-hosted
- Custom lexicons registered for event/rsvp record types

**App View (indexing + serving)**
- Firehose consumer (or polling own PDS pre-federation) → indexes into
  Postgres
- API layer: Node (Fastify) or Elixir/Phoenix
- Postgres + PostGIS for geo queries (events near a São Paulo neighborhood)
- Separate lightweight endpoint(s) for the anonymous interest counter —
  plain DB increment, no atproto involvement

**Frontend**
- SSR framework (SvelteKit or Astro) — read-heavy, low-JS fits the format
- Map view via Leaflet + OpenStreetMap tiles (not Google Maps)
- OAuth-via-atproto for the pseudonymous login flow

**Ops / opsec**
- Hosting jurisdiction chosen deliberately
- No plaintext IP logs tied to event pages or RSVPs
- Tor onion service as an access option (stretch goal, not MVP)
- Moderation: basic report/hide queue for event listings; anonymous counter
  has no moderation tooling by design (soft signal only)

---

## MVP scope (basic features only)

**In scope:**
- Create event (pseudonymous account required)
- View event list + single event page
- RSVP via account (`org.micelio.rsvp`)
- Anonymous "interested" counter (no account)
- Self-hosted single PDS, no federation with wider atproto network yet
- Query own PDS directly for v0 (skip firehose/App View indexer initially)

**Explicitly out of scope for MVP:**
- Federation with Bluesky/wider atproto network
- Full App View firehose indexer (add once core loop is proven)
- Comments/discussion threads
- Tor onion service
- Real access control for "restricted" events (relies on out-of-band
  channels instead)

---

## Rough timeline (1–2 devs, atproto-new)

| Phase | Work | Time |
|---|---|---|
| 1 | atproto learning curve, PDS stood up, DID/repo CRUD understood | ~1 week |
| 2 | Lexicons finalized, event create + RSVP write path | ~1 week |
| 3 | App View indexer, list/single event views | ~1 week |
| 4 | Map/list UI, OAuth login, deploy, basic moderation | ~1 week |

**~3–4 weeks focused full-time**, ~2–3 months evenings/weekends.

**Fastest path to internal-use MVP:** skip the App View indexer for v0,
query own PDS directly (single point of truth, no firehose complexity).
Compresses "usable by our group" milestone to under 2 weeks.

---

## Open questions / next decisions
- [x] Decide project name — **micelio**, lexicon namespace `org.micelio.*`
- [ ] Anti-bot approach for anonymous counter (signed token vs. PoW vs. accept spam)
- [ ] Comment/discussion model (reuse bsky posts vs. custom lexicon) — post-MVP
- [ ] Hosting jurisdiction for PDS
- [ ] Moderation policy for event creation (who can post, verification process)
