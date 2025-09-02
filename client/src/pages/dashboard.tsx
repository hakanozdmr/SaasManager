import { DashboardHeader } from "@/components/dashboard-header";
import { StatsCards } from "@/components/stats-cards";
import { FilterControls } from "@/components/filter-controls";
import { ServicesTable } from "@/components/services-table";
import { RecentActivity } from "@/components/recent-activity";
import { VersionChangeModal } from "@/components/version-change-modal";
import { useState } from "react";

export default function Dashboard() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingVersionChange, setPendingVersionChange] = useState<{
    serviceName: string;
    environment: string;
    fromVersion: string;
    toVersion: string;
  } | null>(null);

  const handleVersionChangeRequest = (serviceName: string, environment: string, fromVersion: string, toVersion: string) => {
    setPendingVersionChange({ serviceName, environment, fromVersion, toVersion });
    setIsModalOpen(true);
  };

  return (
    <div className="bg-background min-h-screen">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards />
        
        <FilterControls 
          selectedEnvironment={selectedEnvironment}
          onEnvironmentChange={setSelectedEnvironment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <ServicesTable 
          selectedEnvironment={selectedEnvironment}
          searchTerm={searchTerm}
          onVersionChangeRequest={handleVersionChangeRequest}
        />
        
        <RecentActivity />
      </main>

      <VersionChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pendingChange={pendingVersionChange}
        onConfirm={() => {
          setIsModalOpen(false);
          setPendingVersionChange(null);
        }}
      />
    </div>
  );
}
