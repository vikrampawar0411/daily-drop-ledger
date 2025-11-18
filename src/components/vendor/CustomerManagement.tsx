
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Users, Phone, Mail } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStates } from "@/hooks/useStates";
import { useCities } from "@/hooks/useCities";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { useProducts } from "@/hooks/useProducts";

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const { customers, loading, refetch } = useCustomers();
  const { toast } = useToast();
  const [connectedCustomerIds, setConnectedCustomerIds] = useState<Set<string>>(new Set());
  const [vendorId, setVendorId] = useState<string | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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
  const { states } = useStates();
  const { cities } = useCities(selectedStateId);
  const { areas } = useAreas();
  const { societies } = useSocieties(selectedAreaId);
  const { products } = useProducts();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    product_id: "",
    state_id: "",
    city_id: "",
    area_id: "",
    society_id: "",
    wing_number: "",
    flat_plot_house_number: "",
    address: "",
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    // For admin, show all customers. For vendor, show only connected ones
    const isConnected = connectedCustomerIds.has(customer.id);
    
    return matchesSearch && (isAdmin || isConnected);
  });

  const handleAddCustomer = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.state_id || !formData.city_id || !formData.area_id || !formData.society_id || !formData.flat_plot_house_number) {
        toast({
          title: "Validation Error",
          description: "Name, phone, state, city, area, society, and flat/plot/house number are required",
          variant: "destructive",
        });
        return;
      }

      // Build the full address from the components
      const fullAddress = [
        formData.flat_plot_house_number,
        formData.wing_number,
        societies.find(s => s.id === formData.society_id)?.name,
        areas.find(a => a.id === formData.area_id)?.name,
        cities.find(c => c.id === formData.city_id)?.name,
        states.find(s => s.id === formData.state_id)?.name
      ].filter(Boolean).join(", ");

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("customers")
        .insert([{
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          product_id: formData.product_id || null,
          area_id: formData.area_id,
          society_id: formData.society_id,
          wing_number: formData.wing_number,
          flat_plot_house_number: formData.flat_plot_house_number,
          address: fullAddress,
          created_by_user_id: user?.id,
          created_by_role: 'vendor',
        }]);

      if (error) throw error;

      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        product_id: "",
        state_id: "",
        city_id: "",
        area_id: "",
        society_id: "",
        wing_number: "",
        flat_plot_house_number: "",
        address: "",
      });
      setSelectedStateId("");
      setSelectedCityId("");
      setSelectedAreaId("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error adding customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, state_id: value, city_id: "", area_id: "", society_id: "" });
                    setSelectedStateId(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, city_id: value, area_id: "", society_id: "" });
                    setSelectedCityId(value);
                  }}
                  disabled={!selectedStateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area *</Label>
                <Select
                  value={formData.area_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, area_id: value, society_id: "" });
                    setSelectedAreaId(value);
                  }}
                  disabled={!selectedCityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.filter(a => a.city_id === selectedCityId).map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="society">Society Name *</Label>
                <Select
                  value={formData.society_id}
                  onValueChange={(value) => setFormData({ ...formData, society_id: value })}
                  disabled={!selectedAreaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select society" />
                  </SelectTrigger>
                  <SelectContent>
                    {societies.map((society) => (
                      <SelectItem key={society.id} value={society.id}>
                        {society.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wing">Wing Number</Label>
                <Input
                  id="wing"
                  value={formData.wing_number}
                  onChange={(e) => setFormData({ ...formData, wing_number: e.target.value })}
                  placeholder="Wing number (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flat">Flat / Plot / House Number *</Label>
                <Input
                  id="flat"
                  value={formData.flat_plot_house_number}
                  onChange={(e) => setFormData({ ...formData, flat_plot_house_number: e.target.value })}
                  placeholder="Flat / Plot / House number"
                />
              </div>
              </div>
            </ScrollArea>
            <div className="pt-4 border-t">
              <Button onClick={handleAddCustomer} className="w-full">
                Add Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? "Try adjusting your search" : "Get started by adding your first customer"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <Badge variant={customer.is_active ? "default" : "secondary"}>
                    {customer.is_active ? "Active" : "Inactive"}
                  </Badge>
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
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
