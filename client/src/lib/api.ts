import { apiRequest } from "./queryClient";
import { Service, Activity, UpdateServiceVersion, InsertService } from "@shared/schema";

export const servicesApi = {
  getAll: (): Promise<Service[]> => 
    apiRequest("GET", "/api/services").then(res => res.json()),
    
  getById: (id: string): Promise<Service> =>
    apiRequest("GET", `/api/services/${id}`).then(res => res.json()),
    
  create: (service: InsertService): Promise<Service> =>
    apiRequest("POST", "/api/services", service).then(res => res.json()),
    
  updateVersion: (update: UpdateServiceVersion): Promise<Service> =>
    apiRequest("PATCH", "/api/services/version", update).then(res => res.json()),
};

export const activitiesApi = {
  getAll: (): Promise<Activity[]> =>
    apiRequest("GET", "/api/activities").then(res => res.json()),
};

export const statsApi = {
  get: (): Promise<{
    totalServices: number;
    prodReadyServices: number;
    uatServices: number;
    pendingUpdates: number;
  }> => apiRequest("GET", "/api/stats").then(res => res.json()),
};
