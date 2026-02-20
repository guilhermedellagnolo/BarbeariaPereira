
import { db } from "./db";
import { shopSettings, services } from "@shared/schema";

async function main() {
  console.log("Checking DB state...");
  
  const allSettings = await db.select().from(shopSettings);
  console.log("Shop Settings:", allSettings);

  const allServices = await db.select().from(services);
  console.log("Services:", allServices);

  process.exit(0);
}

main();
