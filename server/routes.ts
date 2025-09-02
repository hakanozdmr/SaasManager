import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertServiceSchema, updateServiceVersionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all services
  app.get("/api/services", async (req, res) => {
    try {
      const storage = await getStorage();
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get service by ID
  app.get("/api/services/:id", async (req, res) => {
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
  app.post("/api/services", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Update service version
  app.patch("/api/services/version", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = updateServiceVersionSchema.parse(req.body);
      const service = await storage.updateServiceVersion(validatedData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid version update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service version" });
    }
  });

  // Get all activities
  app.get("/api/activities", async (req, res) => {
    try {
      const storage = await getStorage();
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
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
