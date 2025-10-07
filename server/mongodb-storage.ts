import { MongoClient, Db, Collection } from "mongodb";
import {
  type User,
  type InsertUser,
  type Service,
  type InsertService,
  type Activity,
  type InsertActivity,
  type UpdateServiceVersionWithUser,
} from "@shared/schema";
import { IStorage } from "./storage";

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private usersCollection: Collection<User>;
  private servicesCollection: Collection<Service>;
  private activitiesCollection: Collection<Activity>;

  constructor() {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    // Replace <db_password> with actual password if it exists
    const password = process.env.MONGODB_PASSWORD;
    if (password && uri.includes("<db_password>")) {
      uri = uri.replace("<db_password>", encodeURIComponent(password));
      console.log("MongoDB Atlas connection string configured");
    } else {
      console.log(
        "MongoDB URI does not contain <db_password> placeholder or password not provided",
      );
    }

    this.client = new MongoClient(uri);
    this.db = this.client.db("versions");
    this.usersCollection = this.db.collection<User>("users");
    this.servicesCollection = this.db.collection<Service>("services");
    this.activitiesCollection = this.db.collection<Activity>("activities");
  }

  async connect(): Promise<void> {
    try {
      console.log("Attempting to connect to MongoDB...");
      await this.client.connect();
      console.log("Successfully connected to MongoDB");

      // Test the connection
      await this.db.admin().ping();
      console.log("MongoDB ping successful");

      // Initialize with sample data if collections are empty
      await this.initializeSampleData();
      console.log("Sample data initialization completed");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      console.error("MongoDB URI exists:", !!process.env.MONGODB_URI);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private async initializeSampleData(): Promise<void> {
    const userCount = await this.usersCollection.countDocuments();
    if (userCount === 0) {
      await this.createUser({
        username: "admin",
        password: "",
        role: "admin"
      });
    }

    const serviceCount = await this.servicesCollection.countDocuments();

    if (serviceCount === 0) {
      const sampleServices: InsertService[] = [
        {
          name: "auth-service",
          description: "Authentication & Authorization",
          icon: "fas fa-shield-alt",
          iconColor: "blue",
          availableVersions: ["1.1.0", "1.2.0", "1.3.0"],
          bauVersion: "1.2.0",
          uatVersion: "1.3.0",
          prodVersion: "1.1.0",
        },
        {
          name: "payment-service",
          description: "Payment Processing",
          icon: "fas fa-credit-card",
          iconColor: "green",
          availableVersions: ["2.4.0", "2.5.0", "2.5.1", "2.6.0"],
          bauVersion: "2.5.0",
          uatVersion: "2.5.1",
          prodVersion: "2.4.0",
        },
        {
          name: "notification-service",
          description: "Email & SMS Notifications",
          icon: "fas fa-envelope",
          iconColor: "purple",
          availableVersions: ["1.8.0", "1.8.1", "1.8.2", "1.9.0"],
          bauVersion: "1.8.2",
          uatVersion: "1.9.0",
          prodVersion: "1.8.1",
        },
        {
          name: "user-service",
          description: "User Management",
          icon: "fas fa-users",
          iconColor: "yellow",
          availableVersions: ["3.0.5", "3.1.0", "3.1.1", "3.2.0"],
          bauVersion: "3.1.0",
          uatVersion: "3.1.1",
          prodVersion: "3.0.5",
        },
      ];

      for (const service of sampleServices) {
        await this.createService(service);
      }

      const sampleActivities: InsertActivity[] = [
        {
          serviceName: "payment-service",
          environment: "uat",
          fromVersion: "2.4.0",
          toVersion: "2.5.1",
          user: "Admin",
        },
        {
          serviceName: "auth-service",
          environment: "bau",
          fromVersion: "1.1.0",
          toVersion: "1.2.0",
          user: "DevOps",
        },
        {
          serviceName: "notification-service",
          environment: "prod",
          fromVersion: "1.8.0",
          toVersion: "1.8.1",
          user: "QA Team",
        },
      ];

      for (const activity of sampleActivities) {
        await this.createActivity(activity);
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.usersCollection.findOne({ id });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.usersCollection.findOne({ username });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = new Date().getTime().toString();
    const user: User = { ...insertUser, id };
    await this.usersCollection.insertOne(user);
    return user;
  }

  async getAllServices(): Promise<Service[]> {
    const services = await this.servicesCollection
      .find()
      .sort({ name: 1 })
      .toArray();
    return services;
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = await this.servicesCollection.findOne({ id });
    return service || undefined;
  }

  async getServiceByName(name: string): Promise<Service | undefined> {
    const service = await this.servicesCollection.findOne({ name });
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = new Date().getTime().toString();
    const service: Service = {
      ...insertService,
      icon: insertService.icon || "fas fa-cube",
      iconColor: insertService.iconColor || "blue",
      id,
      lastUpdated: new Date(),
    };
    await this.servicesCollection.insertOne(service);
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service> {
    const service = await this.getService(id);
    if (!service) {
      throw new Error(`Service ${id} not found`);
    }

    const updatedService: Service = {
      ...service,
      ...updates,
      id,
      lastUpdated: new Date(),
    };

    await this.servicesCollection.replaceOne({ id }, updatedService);
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.getService(id);
    if (!service) {
      throw new Error(`Service ${id} not found`);
    }
    await this.servicesCollection.deleteOne({ id });
  }

  async updateServiceVersion(update: UpdateServiceVersionWithUser): Promise<Service> {
    const service = await this.getServiceByName(update.serviceName);
    if (!service) {
      throw new Error(`Service ${update.serviceName} not found`);
    }

    const oldVersion = service[
      `${update.environment}Version` as keyof Service
    ] as string;

    // Update available versions to include the new version if not already present
    const currentVersions = [
      service.bauVersion,
      service.uatVersion,
      service.prodVersion,
    ];
    const updatedVersions = [...currentVersions];

    // Add the new version if it's not already in the list
    if (!service.availableVersions.includes(update.version)) {
      updatedVersions.push(update.version);
    }

    // Remove duplicates and filter out empty values
    const versionSet = new Set(
      updatedVersions.filter((v) => v && v.trim().length > 0),
    );
    const newAvailableVersions = Array.from(versionSet);

    // Update the service
    const updatedService: Service = {
      ...service,
      [`${update.environment}Version`]: update.version,
      availableVersions: newAvailableVersions,
      lastUpdated: new Date(),
    };

    await this.servicesCollection.replaceOne(
      { id: service.id },
      updatedService,
    );

    // Create activity record
    await this.createActivity({
      serviceName: update.serviceName,
      environment: update.environment,
      fromVersion: oldVersion,
      toVersion: update.version,
      user: update.user,
    });

    return updatedService;
  }

  async getAllActivities(): Promise<Activity[]> {
    const activities = await this.activitiesCollection
      .find()
      .sort({ timestamp: -1 })
      .toArray();
    return activities;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = new Date().getTime().toString();
    const activity: Activity = {
      ...insertActivity,
      user: insertActivity.user || "Admin",
      id,
      timestamp: new Date(),
    };
    await this.activitiesCollection.insertOne(activity);
    return activity;
  }

  async getStats(): Promise<{
    totalServices: number;
    prodReadyServices: number;
    uatServices: number;
    pendingUpdates: number;
  }> {
    const services = await this.getAllServices();

    const prodReadyServices = services.filter(
      (service) =>
        service.availableVersions.indexOf(service.prodVersion) !== -1,
    ).length;

    const uatServices = services.filter(
      (service) => service.uatVersion !== service.prodVersion,
    ).length;

    const pendingUpdates = services.filter(
      (service) =>
        service.bauVersion !== service.prodVersion ||
        service.uatVersion !== service.prodVersion,
    ).length;

    return {
      totalServices: services.length,
      prodReadyServices,
      uatServices,
      pendingUpdates,
    };
  }
}
