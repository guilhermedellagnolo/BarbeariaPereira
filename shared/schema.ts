import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Admin users (Barbers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(true),
});

// Services offered
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  duration: integer("duration").notNull(), // In minutes
  image: text("image").notNull(),
  category: text("category").default("main"), // main, sporadic
});

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  serviceId: integer("service_id").notNull(), // Foreign key to services handled in logic
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  status: text("status").default("pending"), // pending, confirmed, cancelled, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Blocked Times (Availability)
export const blockedTimes = pgTable("blocked_times", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  startTime: text("start_time"), // HH:MM (if null, means all-day)
  endTime: text("end_time"), // HH:MM
  reason: text("reason"),
});

// Shop Settings (Singleton or Key-Value, using Singleton for simplicity as requested)
export const shopSettings = pgTable("shop_settings", {
  id: serial("id").primaryKey(),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("19:00"),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().max(50),
  password: z.string().max(255),
  name: z.string().max(100),
});
export const insertServiceSchema = createInsertSchema(services, {
  name: z.string().max(100),
  description: z.string().max(500),
  image: z.string().max(255),
  category: z.string().max(20),
});
export const insertBookingSchema = createInsertSchema(bookings, {
  customerName: z.string().max(100, "O nome deve ter no máximo 100 caracteres"),
  customerPhone: z.string().max(20, "Telefone inválido"),
  customerEmail: z.string().email("E-mail inválido").max(255, "E-mail muito longo"),
  date: z.string().max(10),
  time: z.string().max(5),
  status: z.string().max(20).optional(),
});
export const insertBlockedTimeSchema = createInsertSchema(blockedTimes, {
  date: z.string().max(10),
  startTime: z.string().max(5).nullable(),
  endTime: z.string().max(5).nullable(),
  reason: z.string().max(255).nullable(),
});
export const insertShopSettingsSchema = createInsertSchema(shopSettings, {
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BlockedTime = typeof blockedTimes.$inferSelect;
export type ShopSettings = typeof shopSettings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertBlockedTime = z.infer<typeof insertBlockedTimeSchema>;
export type InsertShopSettings = z.infer<typeof insertShopSettingsSchema>;

// Request types
export type CreateBookingRequest = InsertBooking;
export type UpdateBookingStatusRequest = { status: "pending" | "confirmed" | "cancelled" | "completed" };
export type CreateBlockedTimeRequest = InsertBlockedTime;
export type UpdateShopSettingsRequest = InsertShopSettings;

// API Response types
export type ServiceResponse = Service;
export type BookingResponse = Booking & { serviceName?: string }; // Enriched with service data if needed
