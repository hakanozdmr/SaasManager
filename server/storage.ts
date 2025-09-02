import { type User, type InsertUser, type Service, type InsertService, type Activity, type InsertActivity, type UpdateServiceVersion } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Service management
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  getServiceByName(name: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateServiceVersion(update: UpdateServiceVersion): Promise<Service>;
  
  // Activity tracking
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats
  getStats(): Promise<{
    totalServices: number;
    prodReadyServices: number;
    uatServices: number;
    pendingUpdates: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private services: Map<string, Service>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.activities = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample services
    const sampleServices: InsertService[] = [
      {
        name: "auth-service",
        description: "Authentication & Authorization",
        icon: "fas fa-shield-alt",
        iconColor: "blue",
        availableVersions: ["1.1.0", "1.2.0", "1.3.0"],
        bauVersion: "1.2.0",
        uatVersion: "1.3.0",
        prodVersion: "1.1.0"
      },
      {
        name: "payment-service",
        description: "Payment Processing",
        icon: "fas fa-credit-card",
        iconColor: "green",
        availableVersions: ["2.4.0", "2.5.0", "2.5.1", "2.6.0"],
        bauVersion: "2.5.0",
        uatVersion: "2.5.1",
        prodVersion: "2.4.0"
      },
      {
        name: "notification-service",
        description: "Email & SMS Notifications",
        icon: "fas fa-envelope",
        iconColor: "purple",
        availableVersions: ["1.8.0", "1.8.1", "1.8.2", "1.9.0"],
        bauVersion: "1.8.2",
        uatVersion: "1.9.0",
        prodVersion: "1.8.1"
      },
      {
        name: "user-service",
        description: "User Management",
        icon: "fas fa-users",
        iconColor: "yellow",
        availableVersions: ["3.0.5", "3.1.0", "3.1.1", "3.2.0"],
        bauVersion: "3.1.0",
        uatVersion: "3.1.1",
        prodVersion: "3.0.5"
      }
    ];

    for (const service of sampleServices) {
      await this.createService(service);
    }

    // Create sample activities
    const sampleActivities: InsertActivity[] = [
      {
        serviceName: "payment-service",
        environment: "uat",
        fromVersion: "2.4.0",
        toVersion: "2.5.1",
        user: "Admin"
      },
      {
        serviceName: "auth-service",
        environment: "bau",
        fromVersion: "1.1.0",
        toVersion: "1.2.0",
        user: "DevOps"
      },
      {
        serviceName: "notification-service",
        environment: "prod",
        fromVersion: "1.8.0",
        toVersion: "1.8.1",
        user: "QA Team"
      }
    ];

    for (const activity of sampleActivities) {
      await this.createActivity(activity);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    return Array.from(this.services.values()).find(service => service.name === name);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = {
      ...insertService,
      id,
      lastUpdated: new Date()
    };
    this.services.set(id, service);
    return service;
  }

  async updateServiceVersion(update: UpdateServiceVersion): Promise<Service> {
    const service = await this.getServiceByName(update.serviceName);
    if (!service) {
      throw new Error(`Service ${update.serviceName} not found`);
    }

    const oldVersion = service[`${update.environment}Version` as keyof Service] as string;
    
    // Update available versions to include the new version if not already present
    const currentVersions = [service.bauVersion, service.uatVersion, service.prodVersion];
    const updatedVersions = [...currentVersions];
    
    // Add the new version if it's not already in the list
    if (!service.availableVersions.includes(update.version)) {
      updatedVersions.push(update.version);
    }
    
    // Remove duplicates and filter out empty values
    const newAvailableVersions = [...new Set(updatedVersions.filter(v => v && v.trim().length > 0))];
    
    // Update the version
    const updatedService: Service = {
      ...service,
      [`${update.environment}Version`]: update.version,
      availableVersions: newAvailableVersions,
      lastUpdated: new Date()
    };
    
    this.services.set(service.id, updatedService);

    // Create activity record
    await this.createActivity({
      serviceName: update.serviceName,
      environment: update.environment,
      fromVersion: oldVersion,
      toVersion: update.version,
      user: update.user
    });

    return updatedService;
  }

  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      timestamp: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getStats(): Promise<{
    totalServices: number;
    prodReadyServices: number;
    uatServices: number;
    pendingUpdates: number;
  }> {
    const services = await this.getAllServices();
    
    const prodReadyServices = services.filter(service => 
      service.availableVersions.indexOf(service.prodVersion) !== -1
    ).length;
    
    const uatServices = services.filter(service => 
      service.uatVersion !== service.prodVersion
    ).length;
    
    const pendingUpdates = services.filter(service => 
      service.bauVersion !== service.prodVersion || 
      service.uatVersion !== service.prodVersion
    ).length;

    return {
      totalServices: services.length,
      prodReadyServices,
      uatServices,
      pendingUpdates
    };
  }
}

export const storage = new MemStorage();
