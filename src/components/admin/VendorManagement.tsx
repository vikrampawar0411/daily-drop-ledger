import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Search, Store, Phone, Mail, MapPin } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VENDOR_CATEGORIES = [
  "Milk & Dairy",
  "Newspaper & Magazines",
  "Groceries",
  "Vegetables & Fruits",
  "Water Supply",
  "Gas Cylinder",
  "Cleaning Services",
  "Other",
];

const VendorManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const { vendors, loading, refetch } = useVendors();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    password: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    password: "",
  });

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.phone && vendor.phone.includes(searchTerm));
    
    return matchesSearch;
  });

  const handleAddVendor = async () => {
    try {
      if (!formData.name || !formData.category || !formData.contact_person || !formData.phone || !formData.address) {
        toast({
          title: "Validation Error",
          description: "Business name, category, contact person, phone, and address are required",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("vendors")
        .insert([{
          ...formData,
          created_by_user_id: user?.id,
          created_by_role: 'admin',
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor added successfully",
      });

      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        category: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        password: "",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error adding vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditVendor = async () => {
    try {
      if (!editFormData.name || !editFormData.category || !editFormData.contact_person || !editFormData.phone || !editFormData.address) {
        toast({
          title: "Validation Error",
          description: "Business name, category, contact person, phone, and address are required",
          variant: "destructive",
        });
        return;
      }

      let vendorUserId = editingVendor.user_id;

      // If email and password are provided and vendor doesn't have a user_id yet, create auth user
      if (editFormData.email && editFormData.password && !vendorUserId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: editFormData.email,
          password: editFormData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: editFormData.contact_person,
              role: 'vendor'
            }
          }
        });

        if (authError) throw authError;
        vendorUserId = authData.user?.id;
        
        // Note: Profile and user_roles are automatically created by database trigger
      }

      // Update vendor record
      const { error } = await supabase
        .from("vendors")
        .update({
          name: editFormData.name,
          category: editFormData.category,
          contact_person: editFormData.contact_person,
          phone: editFormData.phone,
          email: editFormData.email,
          address: editFormData.address,
          user_id: vendorUserId,
        })
        .eq('id', editingVendor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingVendor(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error updating vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (vendor: any) => {
    setEditingVendor(vendor);
    setEditFormData({
      name: vendor.name,
      category: vendor.category,
      contact_person: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vendor Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Store className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Business Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person Name *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Primary contact person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Business phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Business email address (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete business address"
                  rows={3}
                />
              </div>
              </div>
            </ScrollArea>
            <div className="pt-4 border-t">
              <Button onClick={handleAddVendor} className="w-full">
                Add Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Vendor Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Business Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Business Category *</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact_person">Contact Person Name *</Label>
                <Input
                  id="edit-contact_person"
                  value={editFormData.contact_person}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_person: e.target.value })}
                  placeholder="Primary contact person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Business phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Login Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Email for vendor login"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Login Password {editingVendor?.user_id ? "" : "*"}</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder={editingVendor?.user_id ? "Leave blank to keep current password" : "Set login password"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Business Address *</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="Complete business address"
                  rows={3}
                />
              </div>
              </div>
            </ScrollArea>
            <div className="pt-4 border-t">
              <Button onClick={handleEditVendor} className="w-full">
                Update Vendor
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
              placeholder="Search by name, category or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendor List */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No vendors found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm ? "Try adjusting your search" : "Get started by adding your first vendor"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  <Badge variant={vendor.is_active ? "default" : "secondary"}>
                    {vendor.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{vendor.category}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendor.contact_person && (
                  <div className="text-sm">
                    <div className="font-medium">Contact Person</div>
                    <div className="text-muted-foreground">{vendor.contact_person}</div>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{vendor.email}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{vendor.address}</span>
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditDialog(vendor)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
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

export default VendorManagement;
