
import { db } from "./db";
import { bookings, blockedTimes } from "@shared/schema";

async function main() {
  console.log("Starting data wipe (Bookings + Blocked Times)...");
  try {
    await db.delete(bookings);
    console.log("SUCCESS: Bookings table wiped.");
    await db.delete(blockedTimes);
    console.log("SUCCESS: Blocked Times table wiped.");
  } catch (error) {
    console.error("ERROR: Failed to wipe data:", error);
    process.exit(1);
  }
  process.exit(0);
}

main();
