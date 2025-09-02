import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServicesTableProps {
  selectedEnvironment: string;
  searchTerm: string;
  onVersionChangeRequest: (serviceName: string, environment: string, fromVersion: string, toVersion: string) => void;
}

export function ServicesTable({ selectedEnvironment, searchTerm, onVersionChangeRequest }: ServicesTableProps) {
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, string>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateVersionMutation = useMutation({
    mutationFn: async (data: { serviceName: string; environment: string; version: string; user: string }) => {
      const response = await apiRequest("PATCH", "/api/services/version", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Version updated successfully!",
      });
      setPendingChanges({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update version",
        variant: "destructive",
      });
    }
  });

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleVersionSelect = (serviceName: string, environment: string, version: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        [environment]: version
      }
    }));
  };

  const handleSaveVersions = (serviceName: string) => {
    const serviceChanges = pendingChanges[serviceName];
    if (!serviceChanges) return;

    const service = services.find(s => s.name === serviceName);
    if (!service) return;

    // Process each environment change
    Object.entries(serviceChanges).forEach(([environment, newVersion]) => {
      const currentVersion = service[`${environment}Version` as keyof Service] as string;
      if (currentVersion !== newVersion) {
        onVersionChangeRequest(serviceName, environment, currentVersion, newVersion);
      }
    });
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case "bau": return "bg-blue-100 text-blue-800";
      case "uat": return "bg-orange-100 text-orange-800";
      case "prod": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue": return "text-blue-600 bg-blue-100";
      case "green": return "text-green-600 bg-green-100";
      case "purple": return "text-purple-600 bg-purple-100";
      case "yellow": return "text-yellow-600 bg-yellow-100";
      case "red": return "text-red-600 bg-red-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Versions</CardTitle>
        <p className="text-sm text-muted-foreground">Manage microservice versions across different environments</p>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Service Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">BAU</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">UAT</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">PROD</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Last Updated</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredServices.map((service) => {
                const hasChanges = pendingChanges[service.name];
                
                return (
                  <tr key={service.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(service.iconColor)}`}>
                          <i className={`${service.icon} text-sm`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`text-service-${service.name}`}>
                            {service.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    
                    {["bau", "uat", "prod"].map((env) => (
                      <td key={env} className="py-4 px-6">
                        <div className="space-y-2">
                          <Badge 
                            className={getEnvironmentColor(env)}
                            data-testid={`badge-${service.name}-${env}-version`}
                          >
                            v{service[`${env}Version` as keyof Service] as string}
                          </Badge>
                          <Select
                            value={pendingChanges[service.name]?.[env] || service[`${env}Version` as keyof Service] as string}
                            onValueChange={(value) => handleVersionSelect(service.name, env, value)}
                            data-testid={`select-${service.name}-${env}`}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {service.availableVersions.map((version) => (
                                <SelectItem key={version} value={version}>
                                  v{version}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    ))}
                    
                    <td className="py-4 px-6 text-sm text-muted-foreground" data-testid={`text-${service.name}-last-updated`}>
                      {new Date(service.lastUpdated).toLocaleString()}
                    </td>
                    
                    <td className="py-4 px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveVersions(service.name)}
                        disabled={!hasChanges || updateVersionMutation.isPending}
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-save-${service.name}`}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
