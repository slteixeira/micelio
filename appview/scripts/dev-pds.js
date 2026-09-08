import { TestNetworkNoAppView } from "@atproto/dev-env";
import { writeFileSync } from "node:fs";

// Local-only PDS + PLC for dev, no domain/TLS/Docker needed (see README).
// Boots a network, seeds one account + one sample event, writes appview/.env
// pointing at it, then stays up until Ctrl-C.

const network = await TestNetworkNoAppView.create({ pds: { port: 2583 }, plc: { port: 2582 } });
const agent = network.pds.getAgent();

const { data: account } = await agent.createAccount({
  handle: "maria.test",
  email: "maria@test.micelio",
  password: "hunter2",
});

const now = new Date().toISOString();
const { data: event } = await agent.com.atproto.repo.createRecord({
  repo: account.did,
  collection: "org.micelio.event",
  validate: false, // PDS has no local copy of our lexicon registered
  record: {
    title: "Assembleia de bairro",
    description: "Reunião mensal de organização do bairro.",
    startsAt: now,
    location: { $type: "org.micelio.event#addressLocation", address: "Praça da Sé, São Paulo" },
    visibility: "public",
    createdAt: now,
  },
});

writeFileSync(
  new URL("../.env", import.meta.url),
  `PDS_URL=${network.pds.url}\nEVENT_COLLECTION=org.micelio.event\nRSVP_COLLECTION=org.micelio.rsvp\nCOUNTER_DB_PATH=./counter.sqlite\nPORT=8080\nAPPVIEW_ADMIN_TOKEN=dev-admin-token\n`,
);

console.log(`PDS running at ${network.pds.url}`);
console.log(`Seed account: did=${account.did} handle=maria.test password=hunter2`);
console.log(`Seed event: ${event.uri}`);
console.log(`Admin token: dev-admin-token`);
console.log(`PLC directory at ${network.plc.url} — set frontend PUBLIC_PLC_URL to this (already the .env.example default).`);
console.log(`appview/.env written. Run "npm run dev" in another terminal.`);
console.log(`Ctrl-C to stop.`);

process.on("SIGINT", async () => {
  await network.close();
  process.exit(0);
});

await new Promise(() => {});
