import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, LayoutGrid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  onAddServiceClick: () => void;
  isPaginated: boolean;
  onPaginationToggle: (isPaginated: boolean) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function FilterControls({ 
  searchTerm, 
  onSearchChange,
  onAddServiceClick,
  isPaginated,
  onPaginationToggle,
  pageSize,
  onPageSizeChange
}: FilterControlsProps) {

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          {/* Pagination Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={isPaginated ? "outline" : "default"}
                size="sm"
                onClick={() => onPaginationToggle(false)}
                data-testid="button-show-all"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Show All
              </Button>
              <Button
                variant={isPaginated ? "default" : "outline"}
                size="sm"
                onClick={() => onPaginationToggle(true)}
                data-testid="button-paginated"
              >
                <List className="w-4 h-4 mr-2" />
                Paginated
              </Button>
            </div>
            
            {isPaginated && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => onPageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-24" data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
