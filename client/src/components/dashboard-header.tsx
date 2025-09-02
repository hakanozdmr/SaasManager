import { Button } from "@/components/ui/button";
import { RefreshCw, User, Group } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function DashboardHeader() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries();
      toast({
        title: "Success!",
        description: "Data refreshed successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Group className="text-primary text-2xl w-8 h-8" />
              <h1 className="text-xl font-semibold text-foreground">Microservices Manager</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleRefresh}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-primary-foreground w-4 h-4" />
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-username">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
