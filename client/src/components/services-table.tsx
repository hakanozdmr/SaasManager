import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditServiceModal } from "./edit-service-modal";
import { DeleteServiceDialog } from "./delete-service-dialog";

interface ServicesTableProps {
  searchTerm: string;
  onVersionChangeRequest: (serviceName: string, environment: string, fromVersion: string, toVersion: string) => void;
  isPaginated: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ServicesTable({ 
  searchTerm, 
  onVersionChangeRequest,
  isPaginated,
  currentPage,
  pageSize,
  onPageChange
}: ServicesTableProps) {
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, string>>>({});
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateVersionMutation = useMutation({
    mutationFn: async (data: { serviceName: string; environment: string; version: string; user: string }) => {
      const response = await apiRequest("PATCH", "/api/services/version", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Version updated successfully!",
      });
      setPendingChanges(prev => {
        const newPendingChanges = { ...prev };
        delete newPendingChanges[variables.serviceName];
        return newPendingChanges;
      });
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

  const totalPages = isPaginated ? Math.ceil(filteredServices.length / pageSize) : 1;
  const startIndex = isPaginated ? (currentPage - 1) * pageSize : 0;
  const endIndex = isPaginated ? startIndex + pageSize : filteredServices.length;
  const displayedServices = filteredServices.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleVersionChange = (serviceName: string, environment: string, version: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        [environment]: version
      }
    }));
  };

  const handleSaveVersions = async (serviceName: string) => {
    const serviceChanges = pendingChanges[serviceName];
    if (!serviceChanges) return;

    const service = services.find(s => s.name === serviceName);
    if (!service) return;

    // Process each environment change sequentially
    for (const [environment, newVersion] of Object.entries(serviceChanges)) {
      const currentVersion = service[`${environment}Version` as keyof Service] as string;
      if (currentVersion !== newVersion) {
        try {
          await updateVersionMutation.mutateAsync({
            serviceName,
            environment,
            version: newVersion,
            user: "Admin"
          });
        } catch (error) {
          console.error('Failed to update version:', error);
          break; // Stop processing if one update fails
        }
      }
    }
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
              {displayedServices.map((service) => {
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
                          <Input
                            type="text"
                            placeholder="Enter version"
                            value={pendingChanges[service.name]?.[env] || service[`${env}Version` as keyof Service] as string}
                            onChange={(e) => handleVersionChange(service.name, env, e.target.value)}
                            className="w-full text-sm"
                            data-testid={`input-${service.name}-${env}`}
                          />
                        </div>
                      </td>
                    ))}
                    
                    <td className="py-4 px-6 text-sm text-muted-foreground" data-testid={`text-${service.name}-last-updated`}>
                      {new Date(service.lastUpdated).toLocaleString()}
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingService(service)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          data-testid={`button-edit-${service.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingService(service)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${service.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isPaginated && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredServices.length)} of {filteredServices.length} services
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className="w-10"
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {editingService && (
        <EditServiceModal
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          service={editingService}
        />
      )}

      {deletingService && (
        <DeleteServiceDialog
          isOpen={!!deletingService}
          onClose={() => setDeletingService(null)}
          service={deletingService}
        />
      )}
    </Card>
  );
}
