import { readFileSync } from "node:fs";

const s = readFileSync("/tmp/seb-main.js", "utf8");

const patterns = [
  "loadAllPlacesInfo(",
  "loadAllPlacesInfoSelectedDates(",
  "loadSinglePlace(",
  "getPlaces(",
  "logIn(",
  "getServerData(",
  "validInterval(",
];

for (const p of patterns) {
  let pos = 0;
  let c = 0;
  while ((pos = s.indexOf(p, pos + 1)) !== -1 && c < 2) {
    console.log(`\n=== ${p} @ ${pos} ===`);
    console.log(s.slice(pos, pos + 800));
    c++;
  }
}

const posts = [...s.matchAll(/\.post\("([^"]+)"/g)].map((m) => m[1]);
const gets = [...s.matchAll(/\.get\("([^"]+)"/g)].map((m) => m[1]);
console.log("\nPOST paths:", [...new Set(posts)].sort().join("\n"));
console.log("\nGET paths:", [...new Set(gets)].sort().join("\n"));
