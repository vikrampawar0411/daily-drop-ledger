
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, MapPin, Users, Phone, Mail, LayoutGrid, List } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCities } from "@/hooks/useCities";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { InviteCodeManager } from "@/components/vendor/InviteCodeManager";

interface CustomerManagementProps {
  onEditCustomer?: (customer: any) => void;
  onViewOrders?: (customer: any) => void;
}

const CustomerManagement = ({ onEditCustomer, onViewOrders }: CustomerManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"most_active" | "name_asc" | "name_desc">("most_active");
  const [filterCityId, setFilterCityId] = useState("");
  const [filterAreaId, setFilterAreaId] = useState("");
  const [filterSocietyId, setFilterSocietyId] = useState("");
  const { customers, loading, refetch } = useCustomers();
  const { toast } = useToast();
  const [connectedCustomerIds, setConnectedCustomerIds] = useState<Set<string>>(new Set());
  const [vendorId, setVendorId] = useState<string | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [upcomingCounts, setUpcomingCounts] = useState<Record<string, number>>({});
  // hooks for filters
  
  // Separate hooks for filter dropdowns (fetch all)
  const { cities: allCities } = useCities();
  const { areas: allAreas } = useAreas();
  const { societies: allSocieties } = useSocieties();

  // Fetch vendor ID and connected customers
  useEffect(() => {
    const fetchVendorConnections = async () => {
      if (!user) return;
      
      // Check if user is admin
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (userRole?.role === 'admin') {
        setIsAdmin(true);
        return;
      }
      
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (vendor) {
        setVendorId(vendor.id);
        const { data: connections } = await supabase
          .from('vendor_customer_connections')
          .select('customer_id')
          .eq('vendor_id', vendor.id);
        
        if (connections) {
          setConnectedCustomerIds(new Set(connections.map(c => c.customer_id)));
        }
      }
    };
    
    fetchVendorConnections();
  }, [user]);

  // Fetch upcoming order counts for visible/connected customers
  useEffect(() => {
    const fetchUpcomingCounts = async () => {
      try {
        if (!vendorId) return;
        const targets = customers
          .filter((c) => isAdmin || connectedCustomerIds.has(c.id))
          .map((c) => c.id);
        const today = new Date().toISOString().split("T")[0];
        const next: Record<string, number> = {};
        for (const cid of targets) {
          const { count, error } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("vendor_id", vendorId)
            .eq("customer_id", cid)
            .gte("order_date", today)
            .in("status", ["pending", "pending_approval"]);
          if (error) continue;
          next[cid] = count || 0;
        }
        setUpcomingCounts(next);
      } catch (e) {
        // ignore silently for counts
      }
    };
    fetchUpcomingCounts();
  }, [customers, connectedCustomerIds, vendorId, isAdmin]);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);

    // For admin, show all customers. For vendor, show only connected ones
    const isConnected = connectedCustomerIds.has(customer.id);

    // Status filter
    const isActive = (upcomingCounts[customer.id] ?? 0) > 0;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);

    // Location filters (derive city from area/society)
    const hasAreas = Array.isArray(allAreas) && allAreas.length > 0;
    const hasSocieties = Array.isArray(allSocieties) && allSocieties.length > 0;

    const areaIdFromSociety = customer.society_id && hasSocieties
      ? allSocieties.find((s) => s.id === customer.society_id)?.area_id || null
      : null;
    const customerAreaId = (customer.area_id as string | null) || areaIdFromSociety || null;
    const customerCityId = customerAreaId && hasAreas
      ? allAreas.find((a) => a.id === customerAreaId)?.city_id || null
      : null;

    const matchesCity =
      !filterCityId ||
      // If we don't have area data yet, don't exclude by city
      (!hasAreas ? true : customerCityId === filterCityId);

    const matchesArea =
      !filterAreaId ||
      // If area comes via society but societies not loaded yet, don't exclude
      (!customerAreaId && customer.society_id && !hasSocieties ? true : customerAreaId === filterAreaId);

    const matchesSociety = !filterSocietyId || customer.society_id === filterSocietyId;

    return (
      matchesSearch &&
      (isAdmin || isConnected) &&
      matchesStatus &&
      matchesCity &&
      matchesArea &&
      matchesSociety
    );
  });

  // Sorting based on selected option
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === "most_active") {
      const ac = upcomingCounts[a.id] ?? 0;
      const bc = upcomingCounts[b.id] ?? 0;
      if (bc !== ac) return bc - ac;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name_asc") {
      return a.name.localeCompare(b.name);
    }
    // name_desc
    return b.name.localeCompare(a.name);
  });

  // No direct add-customer flow here; use Invite instead

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!vendorId}>
              <Users className="h-4 w-4 mr-2" />
              Invite New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invite New Customer</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              {vendorId ? (
                <InviteCodeManager vendorId={vendorId} isInDialog />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Vendor context not available.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: "most_active" | "name_asc" | "name_desc") => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most_active">Most Active</SelectItem>
                  <SelectItem value="name_asc">Name A–Z</SelectItem>
                  <SelectItem value="name_desc">Name Z–A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Select
                value={filterCityId || ""}
                onValueChange={(value) => {
                  const v = value === "all" ? "" : value;
                  setFilterCityId(v);
                  // Reset dependent filters when city changes
                  setFilterAreaId("");
                  setFilterSocietyId("");
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {allCities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterAreaId || ""}
                onValueChange={(value) => {
                  const v = value === "all" ? "" : value;
                  setFilterAreaId(v);
                  if (!v) setFilterSocietyId("");
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {allAreas.filter(a => !filterCityId || a.city_id === filterCityId).map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterSocietyId || ""}
                onValueChange={(value) => setFilterSocietyId(value === "all" ? "" : value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All Societies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Societies</SelectItem>
                  {allSocieties.filter(s => !filterAreaId || s.area_id === filterAreaId).map((society) => (
                    <SelectItem key={society.id} value={society.id}>
                      {society.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      {sortedCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? "Try adjusting your search" : "Get started by adding your first customer"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={(upcomingCounts[customer.id] ?? 0) > 0 ? "default" : "secondary"}>
                      {(upcomingCounts[customer.id] ?? 0) > 0 ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.route && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Route: {customer.route}</span>
                  </div>
                )}
                <div className="text-sm">
                  <div className="font-medium">Address</div>
                  <div className="text-muted-foreground">{customer.address}</div>
                </div>
                {customer.email && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={(upcomingCounts[customer.id] ?? 0) > 0 || !vendorId}
                    onClick={async () => {
                      if (!vendorId) return;
                      const hasUpcoming = (upcomingCounts[customer.id] ?? 0) > 0;
                      if (hasUpcoming) {
                        toast({
                          title: "Cannot disconnect",
                          description: "Upcoming orders exist for this customer.",
                          variant: "destructive",
                        });
                        return;
                      }
                      const { error } = await supabase
                        .from("vendor_customer_connections")
                        .delete()
                        .eq("vendor_id", vendorId)
                        .eq("customer_id", customer.id);
                      if (error) {
                        toast({ title: "Disconnect failed", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Disconnected", description: `${customer.name} is disconnected.` });
                        setConnectedCustomerIds((prev) => {
                          const next = new Set(prev);
                          next.delete(customer.id);
                          return next;
                        });
                        refetch();
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onViewOrders?.(customer)}
                  >
                    Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Phone</th>
                    <th className="text-left p-4 font-medium">Address</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-t hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{customer.name}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {customer.phone}
                        </div>
                      </td>
                      <td className="p-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm max-w-xs truncate cursor-help">
                                {customer.address}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{customer.address}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {customer.route && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Route: {customer.route}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={(upcomingCounts[customer.id] ?? 0) > 0 ? "default" : "secondary"} className="w-fit">
                            {(upcomingCounts[customer.id] ?? 0) > 0 ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="w-fit">Connected</Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={(upcomingCounts[customer.id] ?? 0) > 0 || !vendorId}
                            onClick={async () => {
                              if (!vendorId) return;
                              const hasUpcoming = (upcomingCounts[customer.id] ?? 0) > 0;
                              if (hasUpcoming) {
                                toast({
                                  title: "Cannot disconnect",
                                  description: "Upcoming orders exist for this customer.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              const { error } = await supabase
                                .from("vendor_customer_connections")
                                .delete()
                                .eq("vendor_id", vendorId)
                                .eq("customer_id", customer.id);
                              if (error) {
                                toast({ title: "Disconnect failed", description: error.message, variant: "destructive" });
                              } else {
                                toast({ title: "Disconnected", description: `${customer.name} is disconnected.` });
                                setConnectedCustomerIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(customer.id);
                                  return next;
                                });
                                refetch();
                              }
                            }}
                          >
                            Disconnect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewOrders?.(customer)}
                          >
                            Orders
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerManagement;
