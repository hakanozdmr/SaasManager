import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  onAddServiceClick: () => void;
}

export function FilterControls({ 
  searchTerm, 
  onSearchChange,
  onAddServiceClick
}: FilterControlsProps) {

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex justify-end items-center">
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
            <Button onClick={onAddServiceClick} data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
