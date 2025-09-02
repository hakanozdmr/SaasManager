import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, RotateCcw, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (environment: string) => {
    switch (environment) {
      case "prod": return <Check className="text-green-600 w-4 h-4" />;
      case "uat": return <ArrowUp className="text-orange-600 w-4 h-4" />;
      case "bau": return <RotateCcw className="text-blue-600 w-4 h-4" />;
      default: return <ArrowUp className="text-gray-600 w-4 h-4" />;
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

  const getIconBackground = (environment: string) => {
    switch (environment) {
      case "prod": return "bg-green-100";
      case "uat": return "bg-orange-100";
      case "bau": return "bg-blue-100";
      default: return "bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest version changes and deployments</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-activities">
              No recent activities found
            </p>
          ) : (
            activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4" data-testid={`activity-${activity.id}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBackground(activity.environment)}`}>
                  {getActivityIcon(activity.environment)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium" data-testid={`text-activity-user-${activity.id}`}>
                      {activity.user}
                    </span> updated{" "}
                    <span className="font-medium text-primary" data-testid={`text-activity-service-${activity.id}`}>
                      {activity.serviceName}
                    </span>{" "}
                    from v{activity.fromVersion} to v{activity.toVersion} in{" "}
                    <Badge 
                      className={getEnvironmentColor(activity.environment)}
                      data-testid={`badge-activity-env-${activity.id}`}
                    >
                      {activity.environment.toUpperCase()}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`text-activity-time-${activity.id}`}>
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
