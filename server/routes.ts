import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { format } from "date-fns";

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

  // Helper functions for time calculation
  function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

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

      // 1. Fetch all necessary data
      const settings = await storage.getShopSettings();
      const services = await storage.getServices();
      const requestedService = services.find(s => s.id === input.serviceId);
      
      if (!requestedService) {
        return res.status(400).json({ message: "Serviço inválido." });
      }

      // 2. Validate Business Hours
      const openMinutes = timeToMinutes(settings.openTime);
      const closeMinutes = timeToMinutes(settings.closeTime);
      const requestedStart = timeToMinutes(input.time);
      const requestedDuration = requestedService.duration;
      const cleanupTime = 5;
      const requestedEnd = requestedStart + requestedDuration + cleanupTime;

      if (requestedStart < openMinutes || requestedEnd > closeMinutes) {
         return res.status(400).json({ 
           message: "Horário fora do expediente da barbearia." 
         });
      }

      // 3. Validate 2-hour advance notice (BRT Timezone)
      // Current server time in BRT
      const now = new Date();
      const brtNowStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      const brtNow = new Date(brtNowStr);
      
      const bookingDateStr = input.date; // yyyy-MM-dd
      const [bookingHour, bookingMinute] = input.time.split(':').map(Number);
      
      // Construct booking time in BRT context
      // Note: We can't just new Date(bookingDateStr + T + time) because that might interpret as UTC or local server time.
      // We need to compare "Booking Time in BRT" vs "Now in BRT".
      
      // Simplest comparison: Convert everything to minutes from epoch or just compare logically
      // Let's use string comparison for date, and minutes for time if date is today.
      
      const brtTodayStr = format(brtNow, "yyyy-MM-dd");
      
      if (bookingDateStr < brtTodayStr) {
        return res.status(400).json({ message: "Não é possível agendar para datas passadas." });
      }

      if (bookingDateStr === brtTodayStr) {
        const currentMinutes = brtNow.getHours() * 60 + brtNow.getMinutes();
        const limitMinutes = currentMinutes + 120; // 2 hours

        if (requestedStart < limitMinutes) {
          return res.status(400).json({
            message: "Agendamentos devem ser feitos com no mínimo 2 horas de antecedência."
          });
        }
      }

      // 4. Conflict Calculation (Double Validation)
      const existingBookings = await storage.getBookings();
      const dayBookings = existingBookings.filter(b => 
        b.date === input.date && b.status !== "cancelled"
      );
      
      const blockedTimes = await storage.getBlockedTimes();
      const dayBlocked = blockedTimes.filter(b => b.date === input.date);

      // Check against Bookings
      for (const booking of dayBookings) {
        const service = services.find(s => s.id === booking.serviceId);
        if (!service) continue;

        const bookingStart = timeToMinutes(booking.time);
        const bookingEnd = bookingStart + service.duration + cleanupTime;

        // Overlap: (StartA < EndB) and (EndA > StartB)
        if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
          return res.status(409).json({ 
            message: "Horário indisponível devido a conflito com outro agendamento." 
          });
        }
      }

      // Check against Blocked Times
      for (const block of dayBlocked) {
        if (!block.startTime && !block.endTime) {
          return res.status(409).json({ message: "Dia bloqueado pelo administrador." });
        }
        
        if (block.startTime && block.endTime) {
          const blockStart = timeToMinutes(block.startTime);
          const blockEnd = timeToMinutes(block.endTime);
          
          if (requestedStart < blockEnd && requestedEnd > blockStart) {
             return res.status(409).json({ message: "Horário bloqueado pelo administrador." });
          }
        }
      }

      const booking = await storage.createBooking(input);

      // Respond immediately to prevent timeout
      res.status(201).json(booking);

      // Background tasks (Webhook only) - Fire and Forget
      (async () => {
        console.log(`[Background] Starting background tasks for booking ${booking.id}...`);
        try {
          // n8n Webhook Integration
          const webhookUrl = process.env.N8N_WEBHOOK_URL;
          if (webhookUrl && webhookUrl !== "COLOQUE_SEU_WEBHOOK_AQUI") {
            try {
              console.log(`[Background] Sending webhook to n8n for booking ${booking.id}...`);
              fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "new_booking",
                  bookingId: booking.id,
                  customerName: booking.customerName,
                  customerPhone: booking.customerPhone,
                  customerEmail: booking.customerEmail,
                  serviceName: requestedService.name,
                  date: booking.date,
                  time: booking.time,
                  price: requestedService.price,
                  duration: requestedService.duration
                })
              }).catch(err => console.error("n8n Webhook fetch error:", err));
              
              console.log(`[Background] Webhook triggered for booking ${booking.id}`);
            } catch (webhookError) {
              console.error("n8n Webhook failed:", webhookError);
            }
          } else {
             console.log("[Background] N8N_WEBHOOK_URL not configured, skipping webhook.");
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
    const { date, serviceId } = req.query;

    // Backward compatibility for existing frontend (returns occupied slots)
    if (!date || !serviceId) {
      const allBookings = await storage.getBookings();
      const services = await storage.getServices();
      const serviceMap = new Map(services.map(s => [s.id, s]));

      const availability: { date: string, time: string }[] = [];

      for (const booking of allBookings) {
        if (booking.status === "cancelled") continue;
        
        const service = serviceMap.get(booking.serviceId);
        if (!service) continue;

        const startMinutes = timeToMinutes(booking.time);
        const duration = service.duration;
        const cleanup = 5;
        const endMinutes = startMinutes + duration + cleanup;

        for (let time = startMinutes; time < endMinutes; time += 15) {
           if (time >= 24 * 60) break;
           availability.push({
             date: booking.date,
             time: minutesToTime(time)
           });
        }
      }

      const uniqueSet = new Set(availability.map(a => `${a.date}|${a.time}`));
      const uniqueAvailability = Array.from(uniqueSet).map(s => {
        const [date, time] = s.split('|');
        return { date, time };
      });

      return res.json(uniqueAvailability);
    }

    // New Logic: Return AVAILABLE start times
    try {
      const targetDate = String(date);
      const serviceIdNum = Number(serviceId);
      
      const settings = await storage.getShopSettings();
      const safeSettings = settings || { openTime: "09:00", closeTime: "19:00" };
      
      const services = await storage.getServices();
      const service = services.find(s => s.id === serviceIdNum);
      
      if (!service) {
        return res.status(400).json({ message: "Service not found" });
      }

      const openMinutes = timeToMinutes(safeSettings.openTime);
      const closeMinutes = timeToMinutes(safeSettings.closeTime);
      const serviceDuration = service.duration;
      const cleanupTime = 5; // Buffer invisible

      const allBookings = await storage.getBookings();
      const dayBookings = allBookings.filter(b => b.date === targetDate && b.status !== "cancelled");
      
      const allBlocked = await storage.getBlockedTimes();
      const dayBlocked = allBlocked.filter(b => b.date === targetDate);

      const availableSlots: string[] = [];

      // Get current time in BRT (UTC-3) for 2-hour rule
      const now = new Date();
      // Adjust to BRT manually or use library. 
      // Simple approach: server time (UTC) - 3 hours = BRT (approx, ignoring DST if not relevant)
      // Better: use locale string
      const brtNowStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      const brtNow = new Date(brtNowStr);
      
      const isToday = targetDate === format(brtNow, "yyyy-MM-dd");
      const currentMinutes = brtNow.getHours() * 60 + brtNow.getMinutes();

      for (let time = openMinutes; time < closeMinutes; time += 15) {
        const slotStart = time;
        const slotEnd = slotStart + serviceDuration + cleanupTime;

        if (slotEnd > closeMinutes) continue;

        // 2-Hour Rule
        if (isToday) {
          const limitMinutes = currentMinutes + 120;
          if (slotStart < limitMinutes) continue;
        }

        // Conflict Check
        let isConflict = false;

        // Check Bookings
        for (const booking of dayBookings) {
          const bookingService = services.find(s => s.id === booking.serviceId);
          if (!bookingService) continue;

          const bookingStart = timeToMinutes(booking.time);
          const bookingEnd = bookingStart + bookingService.duration + cleanupTime;

          // Overlap: (StartA < EndB) and (EndA > StartB)
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            isConflict = true;
            break;
          }
        }
        if (isConflict) continue;

        // Check Blocked Times
        for (const block of dayBlocked) {
          if (!block.startTime && !block.endTime) {
            isConflict = true; // All day block
            break;
          }
          if (block.startTime && block.endTime) {
            const blockStart = timeToMinutes(block.startTime);
            const blockEnd = timeToMinutes(block.endTime);
            
            if (slotStart < blockEnd && slotEnd > blockStart) {
              isConflict = true;
              break;
            }
          }
        }
        if (isConflict) continue;

        availableSlots.push(minutesToTime(slotStart));
      }

      res.json(availableSlots);

    } catch (error) {
      console.error("Error calculating availability:", error);
      res.status(500).json({ message: "Internal server error" });
    }
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

  // === Shop Settings Routes ===
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getShopSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const settings = await storage.updateShopSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
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
