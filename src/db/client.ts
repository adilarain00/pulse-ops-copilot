/** Drizzle client over the read-write pool — used by app logic and the seed script. */
import { drizzle } from "drizzle-orm/node-postgres";
import { rwPool } from "./pools";
import * as schema from "./schema";

export const db = drizzle(rwPool(), { schema });
export { schema };
