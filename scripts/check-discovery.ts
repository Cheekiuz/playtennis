import { runDiscoveryChecks } from "../src/lib/discovery/check";

const failures = runDiscoveryChecks();
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Discovery checks passed. Test records stayed in memory.");
