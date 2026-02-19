import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (Passport strategy)
  setupAuth(app);

  // === Services Routes ===
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  // === Bookings Routes ===
  
  // Public create booking
  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const booking = await storage.createBooking(input);
      
      // n8n Webhook Integration
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      if (webhookUrl && webhookUrl !== "COLOQUE_SEU_WEBHOOK_AQUI") {
        try {
          // Get service name for the webhook payload
          const services = await storage.getServices();
          const service = services.find(s => s.id === booking.serviceId);
          
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "new_booking",
              customerName: booking.customerName,
              customerPhone: booking.customerPhone,
              serviceName: service?.name || "Unknown Service",
              date: booking.date,
              time: booking.time,
              price: service?.price || 0
            })
          });
        } catch (webhookError) {
          console.error("n8n Webhook failed:", webhookError);
        }
      }

      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Protected Admin Routes
  app.get(api.bookings.list.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.patch(api.bookings.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const id = Number(req.params.id);
    const { status } = req.body;
    
    const updated = await storage.updateBookingStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(updated);
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    console.log("Seeding services...");
    await storage.createService({
      name: "Precision Cut",
      description: "Signature consultation + precision shear work + hot towel finish.",
      price: 4500, // $45.00
      duration: 45,
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000",
    });
    await storage.createService({
      name: "Beard Sculpt",
      description: "Hot towel steam + straight razor lineup + oil treatment.",
      price: 3500, // $35.00
      duration: 30,
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000",
    });
    await storage.createService({
      name: "The Executive",
      description: "Full service cut + beard sculpt + black mask facial.",
      price: 7500, // $75.00
      duration: 75,
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000",
    });
  }

  // Ensure an admin user exists
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    console.log("Creating admin user...");
    // Password will be hashed by auth setup in real scenario, but for now we rely on the auth module to handle creation or we manually create with hashed pass
    // For simplicity here, we assume the auth module handles registration or we use a known hash. 
    // IMPORTANT: In a real app, use a proper registration flow or seed with hashed password.
    // We will handle this in server/auth.ts or just create it via the UI once for this demo,
    // OR, better, let's just create it here if we had a hashing utility exposed.
    // For now, let's leave admin creation to a registration endpoint or manual entry.
  }
}
