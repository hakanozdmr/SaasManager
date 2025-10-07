import { DashboardHeader } from "@/components/dashboard-header";
import { StatsCards } from "@/components/stats-cards";
import { FilterControls } from "@/components/filter-controls";
import { ServicesTable } from "@/components/services-table";
import { RecentActivity } from "@/components/recent-activity";
import { VersionChangeModal } from "@/components/version-change-modal";
import { AddServiceModal } from "@/components/add-service-modal";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { isLoading, requireAuth } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPaginated, setIsPaginated] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    requireAuth();
  }, [isLoading]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [pendingVersionChange, setPendingVersionChange] = useState<{
    serviceName: string;
    environment: string;
    fromVersion: string;
    toVersion: string;
  } | null>(null);

  const handleVersionChangeRequest = (serviceName: string, environment: string, fromVersion: string, toVersion: string) => {
    setPendingVersionChange({ serviceName, environment, fromVersion, toVersion });
    setIsVersionModalOpen(true);
  };

  const handleAddServiceClick = () => {
    setIsAddServiceModalOpen(true);
  };

  const handlePaginationToggle = (paginated: boolean) => {
    setIsPaginated(paginated);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-background min-h-screen">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards />
        
        <FilterControls 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddServiceClick={handleAddServiceClick}
          isPaginated={isPaginated}
          onPaginationToggle={handlePaginationToggle}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
        
        <ServicesTable 
          searchTerm={searchTerm}
          onVersionChangeRequest={handleVersionChangeRequest}
          isPaginated={isPaginated}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
        
        <RecentActivity />
      </main>

      <VersionChangeModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        pendingChange={pendingVersionChange}
        onConfirm={() => {
          setIsVersionModalOpen(false);
          setPendingVersionChange(null);
        }}
      />

      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
      />
    </div>
  );
}
