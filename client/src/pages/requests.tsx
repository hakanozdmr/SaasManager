import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { type Request } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const requestFormSchema = insertRequestSchema.extend({
  bauDeliveryDate: z.string().nullable().optional(),
  uatDeliveryDate: z.string().nullable().optional(),
  productionDate: z.string().nullable().optional(),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

type SortColumn = 'id' | 'requestName' | 'bauDeliveryDate' | 'uatDeliveryDate' | 'productionDate';
type SortDirection = 'asc' | 'desc' | null;

export default function Requests() {
  const { isLoading, requireAuth } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    requireAuth();
  }, [isLoading]);

  const { data: requests, isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const addForm = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requestName: "",
      bauServices: "",
      bauDeliveryDate: null,
      uatServices: "",
      uatDeliveryDate: null,
      productionDate: null,
      jiraEpicLink: null,
      notes: null,
    },
  });

  const editForm = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      return await apiRequest("POST", "/api/requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Success",
        description: "Request created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RequestFormData> }) => {
      return await apiRequest("PUT", `/api/requests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setIsEditDialogOpen(false);
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (request: Request) => {
    setSelectedRequest(request);
    editForm.reset({
      requestName: request.requestName,
      bauServices: request.bauServices,
      bauDeliveryDate: request.bauDeliveryDate 
        ? new Date(request.bauDeliveryDate).toISOString().split('T')[0] 
        : null,
      uatServices: request.uatServices,
      uatDeliveryDate: request.uatDeliveryDate 
        ? new Date(request.uatDeliveryDate).toISOString().split('T')[0] 
        : null,
      productionDate: request.productionDate 
        ? new Date(request.productionDate).toISOString().split('T')[0] 
        : null,
      jiraEpicLink: request.jiraEpicLink,
      notes: request.notes,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (request: Request) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };

  const onAddSubmit = (data: RequestFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: RequestFormData) => {
    if (selectedRequest) {
      updateMutation.mutate({ id: selectedRequest.id, data });
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedRequests = () => {
    if (!requests || !sortColumn || !sortDirection) return requests;
    
    return [...requests].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (sortColumn.includes('Date')) {
        const aTime = new Date(aValue as string).getTime();
        const bTime = new Date(bValue as string).getTime();
        if (aTime < bTime) return sortDirection === 'asc' ? -1 : 1;
        if (aTime > bTime) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedRequests = getSortedRequests();

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-background min-h-screen">
      <DashboardHeader />
      
      <main className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Requests</h1>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-request"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {requestsLoading ? (
          <div className="flex items-center justify-center p-12">Loading requests...</div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 sm:w-36">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('id')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold text-xs sm:text-sm"
                      data-testid="sort-request-id"
                    >
                      <span className="hidden sm:inline">Request ID</span>
                      <span className="sm:hidden">ID</span>
                      <SortIcon column="id" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-36 sm:w-52">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('requestName')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold text-xs sm:text-sm"
                      data-testid="sort-request-name"
                    >
                      <span className="hidden sm:inline">Request Name</span>
                      <span className="sm:hidden">Name</span>
                      <SortIcon column="requestName" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px] sm:min-w-[320px]">
                    <span className="text-xs sm:text-sm font-semibold">
                      <span className="hidden sm:inline">BAU Services</span>
                      <span className="sm:hidden">BAU Svcs</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-32 sm:w-48">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('bauDeliveryDate')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold text-xs sm:text-sm"
                      data-testid="sort-bau-delivery-date"
                    >
                      <span className="hidden sm:inline">BAU Delivery Date</span>
                      <span className="sm:hidden">BAU Date</span>
                      <SortIcon column="bauDeliveryDate" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px] sm:min-w-[320px]">
                    <span className="text-xs sm:text-sm font-semibold">
                      <span className="hidden sm:inline">UAT Services</span>
                      <span className="sm:hidden">UAT Svcs</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-32 sm:w-48">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('uatDeliveryDate')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold text-xs sm:text-sm"
                      data-testid="sort-uat-delivery-date"
                    >
                      <span className="hidden sm:inline">UAT Delivery Date</span>
                      <span className="sm:hidden">UAT Date</span>
                      <SortIcon column="uatDeliveryDate" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32 sm:w-48">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('productionDate')}
                      className="flex items-center hover:bg-transparent p-0 h-auto font-semibold text-xs sm:text-sm"
                      data-testid="sort-production-date"
                    >
                      <span className="hidden sm:inline">Production Date</span>
                      <span className="sm:hidden">Prod Date</span>
                      <SortIcon column="productionDate" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-28 sm:w-36">
                    <span className="text-xs sm:text-sm font-semibold">
                      <span className="hidden sm:inline">Jira Epic Link</span>
                      <span className="sm:hidden">Jira</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-36 sm:w-52">
                    <span className="text-xs sm:text-sm font-semibold">Notes</span>
                  </TableHead>
                  <TableHead className="text-right w-24 sm:w-36">
                    <span className="text-xs sm:text-sm font-semibold">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests && sortedRequests.length > 0 ? (
                  sortedRequests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell className="font-mono text-xs sm:text-sm w-24 sm:w-36 p-2 sm:p-4" data-testid={`text-request-id-${request.id}`}>
                        {request.id}
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm w-36 sm:w-52 p-2 sm:p-4" data-testid={`text-request-name-${request.id}`}>
                        {request.requestName}
                      </TableCell>
                      <TableCell className="min-w-[200px] sm:min-w-[320px] p-2 sm:p-4" data-testid={`text-bau-services-${request.id}`}>
                        <div className="space-y-1">
                          {request.bauServices.split('\n').map((service, idx) => (
                            <div key={idx} className="text-xs sm:text-sm whitespace-nowrap">{service.trim()}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-32 sm:w-48 text-xs sm:text-sm p-2 sm:p-4" data-testid={`text-bau-delivery-${request.id}`}>
                        {request.bauDeliveryDate ? format(new Date(request.bauDeliveryDate), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="min-w-[200px] sm:min-w-[320px] p-2 sm:p-4" data-testid={`text-uat-services-${request.id}`}>
                        <div className="space-y-1">
                          {request.uatServices.split('\n').map((service, idx) => (
                            <div key={idx} className="text-xs sm:text-sm whitespace-nowrap">{service.trim()}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-32 sm:w-48 text-xs sm:text-sm p-2 sm:p-4" data-testid={`text-uat-delivery-${request.id}`}>
                        {request.uatDeliveryDate ? format(new Date(request.uatDeliveryDate), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="w-32 sm:w-48 text-xs sm:text-sm p-2 sm:p-4" data-testid={`text-production-date-${request.id}`}>
                        {request.productionDate ? format(new Date(request.productionDate), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="w-28 sm:w-36 p-2 sm:p-4" data-testid={`text-jira-link-${request.id}`}>
                        {request.jiraEpicLink ? (
                          <a 
                            href={request.jiraEpicLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline text-xs sm:text-sm"
                            data-testid={`link-jira-${request.id}`}
                          >
                            <span className="hidden sm:inline">Link</span>
                            <span className="sm:hidden">🔗</span>
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="w-36 sm:w-52 max-w-xs truncate text-xs sm:text-sm p-2 sm:p-4" data-testid={`text-notes-${request.id}`}>
                        {request.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(request)}
                            data-testid={`button-edit-request-${request.id}`}
                            className="p-1 sm:p-2"
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(request)}
                            data-testid={`button-delete-request-${request.id}`}
                            className="p-1 sm:p-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No requests found. Click "New Request" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Add Request Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add New Request</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="requestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-request-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="bauServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BAU Services (her satırda bir servis)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        data-testid="input-bau-services" 
                        rows={5}
                        placeholder="applicability: 1.1.3&#10;enricher: 2.0.32&#10;..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="bauDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BAU Delivery Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-bau-delivery-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="uatServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAT Services (her satırda bir servis)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        data-testid="input-uat-services" 
                        rows={5}
                        placeholder="applicability: 1.1.3&#10;enricher: 2.0.32&#10;..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="uatDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAT Delivery Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-uat-delivery-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="productionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-production-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="jiraEpicLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira Epic Link</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-jira-epic-link"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-add"
                >
                  {createMutation.isPending ? "Creating..." : "Create Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="requestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-request-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="bauServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BAU Services (her satırda bir servis)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        data-testid="input-edit-bau-services" 
                        rows={5}
                        placeholder="applicability: 1.1.3&#10;enricher: 2.0.32&#10;..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="bauDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BAU Delivery Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-edit-bau-delivery-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="uatServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAT Services (her satırda bir servis)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        data-testid="input-edit-uat-services" 
                        rows={5}
                        placeholder="applicability: 1.1.3&#10;enricher: 2.0.32&#10;..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="uatDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAT Delivery Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-edit-uat-delivery-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="productionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-edit-production-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="jiraEpicLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira Epic Link</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="input-edit-jira-epic-link"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        data-testid="textarea-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] sm:w-full max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the request "{selectedRequest?.requestName}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && deleteMutation.mutate(selectedRequest.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
