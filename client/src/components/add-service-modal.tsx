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

const addServiceFormSchema = insertServiceSchema.omit({
  availableVersions: true,
  icon: true,
  iconColor: true,
});

type AddServiceFormData = z.infer<typeof addServiceFormSchema>;

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddServiceModal({ isOpen, onClose }: AddServiceModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Random icon and color selection
  const getRandomIcon = () => {
    const icons = [
      "fas fa-cube", "fas fa-shield-alt", "fas fa-credit-card", "fas fa-envelope",
      "fas fa-users", "fas fa-database", "fas fa-server", "fas fa-cloud"
    ];
    return icons[Math.floor(Math.random() * icons.length)];
  };

  const getRandomColor = () => {
    const colors = ["blue", "green", "purple", "yellow", "red"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const form = useForm<AddServiceFormData>({
    resolver: zodResolver(addServiceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      bauVersion: "",
      uatVersion: "",
      prodVersion: "0.1.0",
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
    // Generate available versions from the provided versions
    const allVersions = [data.bauVersion, data.uatVersion, data.prodVersion]
      .filter(v => v && v.trim().length > 0)
      .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

    const serviceData: InsertService = {
      name: data.name,
      description: data.description,
      icon: getRandomIcon(),
      iconColor: getRandomColor(),
      availableVersions: allVersions,
      bauVersion: data.bauVersion,
      uatVersion: data.uatVersion,
      prodVersion: data.prodVersion,
    };

    createServiceMutation.mutate(serviceData);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-add-service">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Create a new microservice entry with version information. Icon and color will be randomly assigned.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="0.1.0 (default)"
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