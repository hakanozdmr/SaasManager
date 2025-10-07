import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Service } from "@shared/schema";

interface DeleteServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export function DeleteServiceDialog({ isOpen, onClose, service }: DeleteServiceDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/services/${service.id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteServiceMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent data-testid="dialog-delete-service">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fas fa-trash text-red-600"></i>
            </div>
            <span>Delete Service</span>
          </AlertDialogTitle>
          <AlertDialogDescription data-testid="text-delete-confirmation">
            Are you sure you want to delete <strong>{service.name}</strong>? This action cannot be
            undone and will remove all version history for this service.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteServiceMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
            data-testid="button-confirm-delete"
          >
            {deleteServiceMutation.isPending ? "Deleting..." : "Delete Service"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
