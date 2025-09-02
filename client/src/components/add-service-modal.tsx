import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema, type InsertService } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const addServiceFormSchema = insertServiceSchema.extend({
  availableVersions: z.string().min(1, "At least one version is required"),
});

type AddServiceFormData = z.infer<typeof addServiceFormSchema>;

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddServiceModal({ isOpen, onClose }: AddServiceModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<AddServiceFormData>({
    resolver: zodResolver(addServiceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "fas fa-cube",
      iconColor: "blue",
      availableVersions: "",
      bauVersion: "",
      uatVersion: "",
      prodVersion: "",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: InsertService) => {
      const response = await apiRequest("POST", "/api/services", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success!",
        description: "Service created successfully!",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddServiceFormData) => {
    const versions = data.availableVersions
      .split(",")
      .map(v => v.trim())
      .filter(v => v.length > 0);

    const serviceData: InsertService = {
      name: data.name,
      description: data.description,
      icon: data.icon,
      iconColor: data.iconColor,
      availableVersions: versions,
      bauVersion: data.bauVersion,
      uatVersion: data.uatVersion,
      prodVersion: data.prodVersion,
    };

    createServiceMutation.mutate(serviceData);
  };

  const iconOptions = [
    { value: "fas fa-cube", label: "Cube" },
    { value: "fas fa-shield-alt", label: "Shield" },
    { value: "fas fa-credit-card", label: "Credit Card" },
    { value: "fas fa-envelope", label: "Envelope" },
    { value: "fas fa-users", label: "Users" },
    { value: "fas fa-database", label: "Database" },
    { value: "fas fa-server", label: "Server" },
    { value: "fas fa-cloud", label: "Cloud" },
  ];

  const colorOptions = [
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "purple", label: "Purple" },
    { value: "yellow", label: "Yellow" },
    { value: "red", label: "Red" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-add-service">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Create a new microservice entry with version information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., auth-service" 
                        {...field} 
                        data-testid="input-service-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon Color</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-icon-color">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the service"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-icon">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center space-x-2">
                            <i className={`${icon.value} w-4 h-4`}></i>
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availableVersions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Versions</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 1.0.0, 1.1.0, 1.2.0 (comma separated)"
                      {...field}
                      data-testid="input-available-versions"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bauVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BAU Version</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1.0.0"
                        {...field}
                        data-testid="input-bau-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uatVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAT Version</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1.1.0"
                        {...field}
                        data-testid="input-uat-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prodVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PROD Version</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1.0.0"
                        {...field}
                        data-testid="input-prod-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel-add"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createServiceMutation.isPending}
                data-testid="button-submit-add"
              >
                {createServiceMutation.isPending ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}