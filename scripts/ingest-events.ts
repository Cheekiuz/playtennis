import { ingestAllEnabled, ingestIsEnabled } from "../src/lib/discovery/ingest";

if (!ingestIsEnabled() && process.env.INGEST_DRY_RUN !== "true") {
  console.error("Set INGEST_ENABLED=true or INGEST_DRY_RUN=true before running ingest.");
  process.exit(1);
}

const results = await ingestAllEnabled();
console.log(JSON.stringify(results, null, 2));
const errors = Object.values(results).flatMap((item) => item.errors);
if (errors.length > 0) process.exit(1);
