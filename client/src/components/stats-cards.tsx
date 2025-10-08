import { Card, CardContent } from "@/components/ui/card";
import { Box } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery<{
    totalServices: number;
    prodReadyServices: number;
    uatServices: number;
    pendingUpdates: number;
  }>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 max-w-xs">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-16 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 max-w-xs">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Servis</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-total-services">
                {stats?.totalServices || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Box className="text-blue-600 w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
