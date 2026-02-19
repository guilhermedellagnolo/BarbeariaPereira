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
});

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  serviceId: integer("service_id").notNull(), // Foreign key to services handled in logic
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  status: text("status").default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertServiceSchema = createInsertSchema(services);
export const insertBookingSchema = createInsertSchema(bookings);

// === TYPES ===

export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Request types
export type CreateBookingRequest = InsertBooking;
export type UpdateBookingStatusRequest = { status: "pending" | "confirmed" | "cancelled" };

// API Response types
export type ServiceResponse = Service;
export type BookingResponse = Booking & { serviceName?: string }; // Enriched with service data if needed
