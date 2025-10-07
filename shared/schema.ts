import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("fas fa-cube"),
  iconColor: text("icon_color").notNull().default("blue"),
  availableVersions: text("available_versions").array().notNull(),
  bauVersion: text("bau_version").notNull(),
  uatVersion: text("uat_version").notNull(),
  prodVersion: text("prod_version").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull().default("version_change"),
  serviceName: text("service_name").notNull(),
  environment: text("environment"),
  fromVersion: text("from_version"),
  toVersion: text("to_version"),
  details: text("details"),
  user: text("user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  lastUpdated: true,
}).extend({
  name: z.string().min(1, "Service name is required"),
  availableVersions: z.array(z.string()).optional().default(["0.1.0"]),
  bauVersion: z.string().optional().default("0.1.0"),
  uatVersion: z.string().optional().default("0.1.0"),
  prodVersion: z.string().optional().default("0.1.0"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const updateServiceVersionSchema = z.object({
  serviceName: z.string(),
  environment: z.enum(["bau", "uat", "prod"]),
  version: z.string(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type UpdateServiceVersion = z.infer<typeof updateServiceVersionSchema>;
export type UpdateServiceVersionWithUser = UpdateServiceVersion & { user: string };

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull().default(""),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).extend({
  password: z.string().optional().default(""),
  role: z.enum(["admin", "user"]).optional().default("user"),
});

export const loginSchema = z.object({
  username: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
