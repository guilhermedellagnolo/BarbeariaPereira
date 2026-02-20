
import { db } from "./db";
import { blockedTimes } from "@shared/schema";

async function main() {
  console.log("Checking Blocked Times...");
  const blocks = await db.select().from(blockedTimes);
  console.log("Blocked Times:", blocks);
  process.exit(0);
}

main();
