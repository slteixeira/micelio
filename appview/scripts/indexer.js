import { runIndexer } from "../src/indexer.js";

// Standalone firehose consumer — see docs/firehose-indexer-spec.md.
// Run alongside the App View once INDEXER_ENABLED=true in appview/.env.

const firehose = await runIndexer();
console.log("[indexer] backfill complete, streaming live from firehose");

process.on("SIGINT", async () => {
  await firehose.destroy();
  process.exit(0);
});
