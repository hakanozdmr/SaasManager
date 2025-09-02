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

interface VersionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingChange: {
    serviceName: string;
    environment: string;
    fromVersion: string;
    toVersion: string;
  } | null;
  onConfirm: () => void;
}

export function VersionChangeModal({ isOpen, onClose, pendingChange, onConfirm }: VersionChangeModalProps) {
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
      onConfirm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update version",
        variant: "destructive",
      });
      onClose();
    }
  });

  const handleConfirm = () => {
    if (!pendingChange) return;
    
    updateVersionMutation.mutate({
      serviceName: pendingChange.serviceName,
      environment: pendingChange.environment,
      version: pendingChange.toVersion,
      user: "Admin"
    });
  };

  if (!pendingChange) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent data-testid="modal-version-change">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-orange-600"></i>
            </div>
            <span>Confirm Version Change</span>
          </AlertDialogTitle>
          <AlertDialogDescription data-testid="text-confirmation-message">
            Are you sure you want to update <strong>{pendingChange.serviceName}</strong> from{" "}
            <strong>v{pendingChange.fromVersion}</strong> to <strong>v{pendingChange.toVersion}</strong> in{" "}
            <strong>{pendingChange.environment.toUpperCase()}</strong> environment?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={updateVersionMutation.isPending}
            data-testid="button-confirm"
          >
            {updateVersionMutation.isPending ? "Updating..." : "Confirm Update"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
