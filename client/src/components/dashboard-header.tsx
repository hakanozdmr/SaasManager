import { Button } from "@/components/ui/button";
import { RefreshCw, User, Group, LogOut, Users, FileText } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function DashboardHeader() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

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
            <Link href="/requests">
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-requests"
              >
                <FileText className="w-4 h-4 mr-2" />
                Requests
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/users">
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-user-management"
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              </Link>
            )}
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
              <span className="text-sm text-muted-foreground" data-testid="text-username">
                {user?.username || "Guest"}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
