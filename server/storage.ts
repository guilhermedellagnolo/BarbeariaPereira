import { db } from "./db";
import {
  users,
  services,
  bookings,
  blockedTimes,
  type User,
  type InsertUser,
  type Service,
  type InsertService,
  type Booking,
  type InsertBooking,
  type BlockedTime,
  type InsertBlockedTime,
  shopSettings,
  type ShopSettings,
  type InsertShopSettings,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User/Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<void>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;

  // Blocked Times
  getBlockedTimes(): Promise<BlockedTime[]>;
  createBlockedTime(blockedTime: InsertBlockedTime): Promise<BlockedTime>;
  deleteBlockedTime(id: number): Promise<void>;

  // Shop Settings
  getShopSettings(): Promise<ShopSettings>;
  updateShopSettings(settings: InsertShopSettings): Promise<ShopSettings>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(
    id: number,
    update: Partial<InsertService>,
  ): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set(update)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getBlockedTimes(): Promise<BlockedTime[]> {
    return await db.select().from(blockedTimes);
  }

  async createBlockedTime(insertBlockedTime: InsertBlockedTime): Promise<BlockedTime> {
    const [blockedTime] = await db
      .insert(blockedTimes)
      .values(insertBlockedTime)
      .returning();
    return blockedTime;
  }

  async deleteBlockedTime(id: number): Promise<void> {
    await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
  }

  async getShopSettings(): Promise<ShopSettings> {
    try {
      const [settings] = await db.select().from(shopSettings).limit(1);
      if (settings) return settings;
      
      // Create default if not exists
      const [newSettings] = await db.insert(shopSettings).values({
        openTime: "09:00",
        closeTime: "19:00",
      }).returning();
      
      if (newSettings) return newSettings;
    } catch (error) {
      console.error("Database error in getShopSettings, using fallback:", error);
    }
    
    // Ultimate fallback protection
    return { id: 1, openTime: "09:00", closeTime: "19:00" };
  }

  async updateShopSettings(update: InsertShopSettings): Promise<ShopSettings> {
    const existing = await this.getShopSettings();
    const [settings] = await db
      .update(shopSettings)
      .set(update)
      .where(eq(shopSettings.id, existing.id))
      .returning();
    return settings;
  }
}

export const storage = new DatabaseStorage();
