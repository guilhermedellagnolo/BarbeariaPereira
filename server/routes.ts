import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { sendBookingConfirmation } from "./email";
import rateLimit from "express-rate-limit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (Passport strategy)
  setupAuth(app);

  // Booking specific rate limiter - 3 requests per hour
  const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Limite de agendamentos excedido. Por favor, tente novamente em uma hora."
  });

  // === Services Routes ===
  app.get(api.services.list.path, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post(api.services.create.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const input = api.services.create.input.parse(req.body);
      const service = await storage.createService(input);
      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.services.update.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const id = Number(req.params.id);
    try {
      const input = api.services.update.input.parse(req.body);
      const updated = await storage.updateService(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.services.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const id = Number(req.params.id);
    await storage.deleteService(id);
    res.status(204).send();
  });

  // === Bookings Routes ===
  
  // Public create booking
  app.post(api.bookings.create.path, bookingLimiter, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const booking = await storage.createBooking(input);

      // Respond immediately to prevent timeout
      res.status(201).json(booking);

      // Background tasks (Email & Webhook) - Fire and Forget
      (async () => {
        console.log(`[Background] Starting background tasks for booking ${booking.id}...`);
        try {
          const services = await storage.getServices();
          const service = services.find(s => s.id === booking.serviceId);

          // Email Confirmation
          if (service) {
            console.log(`[Background] Sending email for booking ${booking.id}...`);
            try {
              await sendBookingConfirmation(
                booking.customerEmail,
                booking.customerName,
                service.name,
                booking.date,
                booking.time,
                service.price
              );
              console.log(`[Background] Email sent successfully for booking ${booking.id}`);
            } catch (emailError) {
              console.error(`❌ [Background] Failed to send email for booking ${booking.id}:`, emailError);
            }
          } else {
            console.warn(`[Background] Service not found for booking ${booking.id}, skipping email.`);
          }

          // n8n Webhook Integration
          const webhookUrl = process.env.N8N_WEBHOOK_URL;
          if (webhookUrl && webhookUrl !== "COLOQUE_SEU_WEBHOOK_AQUI") {
            try {
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
        } catch (backgroundError) {
          console.error("Background task error:", backgroundError);
        }
      })();
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

  // Public Availability Route
  app.get(api.bookings.availability.path, async (req, res) => {
    const bookings = await storage.getBookings();
    const availability = bookings
      .filter(b => b.status !== "cancelled") // Only active bookings block time
      .map(b => ({
        date: b.date,
        time: b.time
      }));
    res.json(availability);
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

  // === Blocked Times Routes ===
  app.get(api.blockedTimes.list.path, async (req, res) => {
    const blockedTimes = await storage.getBlockedTimes();
    res.json(blockedTimes);
  });

  app.post(api.blockedTimes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const input = api.blockedTimes.create.input.parse(req.body);
      const blockedTime = await storage.createBlockedTime(input);
      res.status(201).json(blockedTime);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.blockedTimes.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const id = Number(req.params.id);
    await storage.deleteBlockedTime(id);
    res.status(204).send();
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingServices = await storage.getServices();
  if (existingServices.length === 0) {
    await storage.createService({
      name: "Corte Premium",
      description: "Corte na tesoura/máquina com finalização de alta precisão.",
      price: 8000, // R$ 80,00
      duration: 45,
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000",
    });
    await storage.createService({
      name: "Barba Terapia",
      description: "Toalha quente, massagem facial e alinhamento milimétrico.",
      price: 5000, // R$ 50,00
      duration: 30,
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1000",
    });
    await storage.createService({
      name: "Combo Máster",
      description: "Corte Premium + Barba Terapia + Assepsia completa.",
      price: 12000, // R$ 120,00
      duration: 75,
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000",
    });
  }

  // Ensure an admin user exists
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "Administrador",
      isAdmin: true,
    });
  }
}
