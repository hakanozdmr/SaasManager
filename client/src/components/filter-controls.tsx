import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  selectedEnvironment: string;
  onEnvironmentChange: (environment: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

export function FilterControls({ 
  selectedEnvironment, 
  onEnvironmentChange, 
  searchTerm, 
  onSearchChange 
}: FilterControlsProps) {
  const environments = [
    { value: "all", label: "All Environments" },
    { value: "bau", label: "BAU" },
    { value: "uat", label: "UAT" },
    { value: "prod", label: "PROD" }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          {/* Environment Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {environments.map((env) => (
              <Button
                key={env.value}
                variant={selectedEnvironment === env.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onEnvironmentChange(env.value)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all",
                  selectedEnvironment === env.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`button-filter-${env.value}`}
              >
                {env.label}
              </Button>
            ))}
          </div>
          
          {/* Search and Actions */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
                data-testid="input-search"
              />
            </div>
            <Button data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
