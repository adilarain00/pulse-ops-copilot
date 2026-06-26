/**
 * Local seed CLI: `pnpm db:seed` (needs a reachable DB in .env.local).
 * The actual logic lives in src/db/seed-core.ts so the runtime setup endpoint
 * can reuse it.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { seedDatabase } from "../src/db/seed-core";
import { rwPool } from "../src/db/pools";

seedDatabase()
  .then(async (counts) => {
    console.log("Seeded:", counts);
    await rwPool().end();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
