import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertServiceSchema, updateServiceVersionSchema, loginSchema, insertUserSchema, type User } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import memorystore from "memorystore";

const MemoryStore = memorystore(session);

declare module "express-session" {
  interface SessionData {
    user?: User;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "development-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username } = loginSchema.parse(req.body);
      const storage = await getStorage();
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username" });
      }
      
      req.session.user = user;
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: req.session.user });
  });

  // User management (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const storage = await getStorage();
      res.json({ users: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get all services
  app.get("/api/services", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get service by ID
  app.get("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Create new service
  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertServiceSchema.parse(req.body);
      const username = req.session.user?.username || "Unknown";
      const service = await storage.createServiceWithActivity(validatedData, username);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Update service
  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const username = req.session.user?.username || "Unknown";
      const service = await storage.updateService(req.params.id, validatedData, username);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Delete service
  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const username = req.session.user?.username || "Unknown";
      await storage.deleteService(req.params.id, username);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Update service version
  app.patch("/api/services/version", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = updateServiceVersionSchema.parse(req.body);
      const username = req.session.user?.username || "Unknown";
      const service = await storage.updateServiceVersion({
        ...validatedData,
        user: username,
      });
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid version update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service version" });
    }
  });

  // Get all activities
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Get stats
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const storage = await getStorage();
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
