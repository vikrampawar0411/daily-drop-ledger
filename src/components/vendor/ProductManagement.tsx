import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, Milk, Newspaper, Trash2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import { useProductRequests } from "@/hooks/useProductRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProductManagement = () => {
  const { products, loading: productsLoading } = useProducts();
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<string | undefined>();
  const { vendorProducts, loading: vendorProductsLoading, addVendorProduct, removeVendorProduct } = useVendorProducts(vendorId);
  const { productRequests, loading: requestsLoading, createProductRequest } = useProductRequests(vendorId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [newRequest, setNewRequest] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    availability: "Daily",
    description: ""
  });

  useEffect(() => {
    const fetchVendorId = async () => {
      if (user) {
        const { data } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setVendorId(data.id);
        }
      }
    };
    fetchVendorId();
  }, [user]);

  const handleAddProduct = async () => {
    if (selectedProduct && vendorId) {
      try {
        await addVendorProduct(selectedProduct);
        setShowAddDialog(false);
        setSelectedProduct("");
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleRequestProduct = async () => {
    if (newRequest.name && newRequest.category && newRequest.price && vendorId && user) {
      try {
        await createProductRequest({
          vendor_id: vendorId,
          requested_by_user_id: user.id,
          name: newRequest.name,
          category: newRequest.category,
          price: parseFloat(newRequest.price),
          unit: newRequest.unit,
          availability: newRequest.availability,
          description: newRequest.description || null,
        });
        setNewRequest({
          name: "",
          category: "",
          price: "",
          unit: "",
          availability: "Daily",
          description: ""
        });
        setShowRequestDialog(false);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const getProductIcon = (category: string) => {
    switch (category) {
      case "Milk":
        return <Milk className="h-5 w-5 text-blue-600" />;
      case "Newspaper":
        return <Newspaper className="h-5 w-5 text-orange-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  const availableProducts = products.filter(
    (p) => !vendorProducts.some((vp) => vp.product_id === p.id)
  );

  if (productsLoading || vendorProductsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Existing Product
          </Button>
          <Button variant="outline" onClick={() => setShowRequestDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request New Product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="my-products">
        <TabsList>
          <TabsTrigger value="my-products">My Products ({vendorProducts.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({productRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-products" className="space-y-4">
          {vendorProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No products added yet</p>
                <p className="text-sm text-muted-foreground mt-2">Add products from the master list to start</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorProducts.map((vp) => (
                <Card key={vp.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getProductIcon(vp.product?.category || "")}
                        <CardTitle className="text-lg">{vp.product?.name}</CardTitle>
                      </div>
                      <Badge variant={vp.is_active ? "default" : "secondary"}>
                        {vp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Category:</span>
                        <div className="text-muted-foreground">{vp.product?.category}</div>
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>
                        <div className="text-muted-foreground">₹{vp.price_override || vp.product?.price} {vp.product?.unit}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Availability:</span>
                      <div className="text-muted-foreground">{vp.product?.availability}</div>
                    </div>
                    
                    {vp.product?.description && (
                      <div className="text-sm">
                        <span className="font-medium">Description:</span>
                        <div className="text-muted-foreground">{vp.product.description}</div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                        onClick={() => removeVendorProduct(vp.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {productRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No product requests</p>
                <p className="text-sm text-muted-foreground mt-2">Request new products for admin approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {productRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{request.name}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Category:</span>
                        <div className="text-muted-foreground">{request.category}</div>
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>
                        <div className="text-muted-foreground">₹{request.price} {request.unit}</div>
                      </div>
                      <div>
                        <span className="font-medium">Availability:</span>
                        <div className="text-muted-foreground">{request.availability}</div>
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span>
                        <div className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {request.description && (
                      <div className="text-sm">
                        <span className="font-medium">Description:</span>
                        <div className="text-muted-foreground">{request.description}</div>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Admin Notes:</span>
                        <div className="text-muted-foreground">{request.admin_notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product from Master List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.price} {product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={!selectedProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request New Product Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <Input
                  value={newRequest.name}
                  onChange={(e) => setNewRequest({...newRequest, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Select value={newRequest.category} onValueChange={(value) => setNewRequest({...newRequest, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Milk">Milk</SelectItem>
                    <SelectItem value="Newspaper">Newspaper</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price *</label>
                <Input
                  type="number"
                  value={newRequest.price}
                  onChange={(e) => setNewRequest({...newRequest, price: e.target.value})}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit *</label>
                <Input
                  value={newRequest.unit}
                  onChange={(e) => setNewRequest({...newRequest, unit: e.target.value})}
                  placeholder="e.g., per litre, per copy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Availability</label>
                <Select value={newRequest.availability} onValueChange={(value) => setNewRequest({...newRequest, availability: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={newRequest.description}
                onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                placeholder="Enter product description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRequestProduct}
              disabled={!newRequest.name || !newRequest.category || !newRequest.price || !newRequest.unit}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
