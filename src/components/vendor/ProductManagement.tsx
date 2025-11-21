import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Package, Milk, Newspaper, Trash2, Upload, Image as ImageIcon, DollarSign, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/hooks/useProducts";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import { useProductRequests } from "@/hooks/useProductRequests";
import { useProductEditRequests } from "@/hooks/useProductEditRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PRODUCT_CATEGORIES = ["Milk", "Newspaper", "Grocery", "Vegetables", "Fruits", "Other"];

const ProductManagement = () => {
  const { products, loading: productsLoading } = useProducts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendorId, setVendorId] = useState<string | undefined>();
  const { vendorProducts, loading: vendorProductsLoading, addVendorProduct, removeVendorProduct, addStock, updateStockStatus, updatePrice } = useVendorProducts(vendorId);
  const { productRequests, loading: requestsLoading, createProductRequest } = useProductRequests(vendorId);
  const { createEditRequest } = useProductEditRequests(vendorId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductForImage, setSelectedProductForImage] = useState<any>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [newRequest, setNewRequest] = useState({
    name: "",
    category: "",
    price: "",
    unit: "Nos",
    description: "",
    inStock: true
  });
  
  // Stock and Price Management States
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<any>(null);
  const [stockQuantityToAdd, setStockQuantityToAdd] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  
  // Stock toggle state for each product
  const [stockToggles, setStockToggles] = useState<Record<string, boolean>>({});
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    unit: "",
    description: "",
    subscribe_before: "",
    delivery_before: "",
    price: ""
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
      // Check if product already added
      const alreadyAdded = vendorProducts.some(vp => vp.product_id === selectedProduct);
      if (alreadyAdded) {
        toast({
          title: "Product already added",
          description: "This product is already in your list",
          variant: "destructive",
        });
        return;
      }

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
    if (!newRequest.name || !newRequest.category || !newRequest.price || !vendorId || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if product name already exists
    const existingProduct = products.find(p => 
      p.name.toLowerCase().trim() === newRequest.name.toLowerCase().trim()
    );
    if (existingProduct) {
      toast({
        title: "Product already exists",
        description: "A product with this name already exists. Please add it from the master list instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProductRequest({
        vendor_id: vendorId,
        requested_by_user_id: user.id,
        name: newRequest.name,
        category: newRequest.category,
        price: parseFloat(newRequest.price),
        unit: newRequest.unit,
        availability: "Daily",
        description: newRequest.description || null,
      });
      setNewRequest({
        name: "",
        category: "",
        price: "",
        unit: "Nos",
        description: "",
        inStock: true
      });
      setShowRequestDialog(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAddStock = async () => {
    if (!selectedProductForStock || !stockQuantityToAdd) return;
    
    const quantity = parseFloat(stockQuantityToAdd);
    if (quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      await addStock(selectedProductForStock.id, quantity);
      setShowStockDialog(false);
      setStockQuantityToAdd("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdatePriceImmediate = async () => {
    if (!selectedProductForPrice || !newPrice) return;
    
    const price = parseFloat(newPrice);
    if (price < 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePrice(selectedProductForPrice.id, price === 0 ? null : price);
      setShowPriceDialog(false);
      setNewPrice("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateTimesImmediate = async (productId: string, subscribeBefore: string, deliveryBefore: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          subscribe_before: subscribeBefore || null,
          delivery_before: deliveryBefore || null
        } as any)
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time fields updated successfully",
      });
      
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error updating times",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitEditRequest = async () => {
    if (!selectedForEdit || !vendorId || !user) return;

    try {
      await createEditRequest({
        product_id: selectedForEdit.product.id,
        vendor_id: vendorId,
        requested_by_user_id: user.id,
        proposed_name: editForm.name || undefined,
        proposed_category: editForm.category || undefined,
        proposed_unit: editForm.unit || undefined,
        proposed_description: editForm.description || undefined,
      });
      
      setShowEditDialog(false);
      setSelectedForEdit(null);
      setEditForm({
        name: "",
        category: "",
        unit: "",
        description: "",
        subscribe_before: "",
        delivery_before: "",
        price: ""
      });
    } catch (error) {
      // Error handled by hook
    }
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedProductForImage) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProductForImage.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', selectedProductForImage.id);

      if (updateError) throw updateError;

      setShowImageDialog(false);
      setSelectedProductForImage(null);
      
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
        return <Badge className="border-2 border-gray-400 text-gray-700">Rejected</Badge>;
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
                    {(vp.product as any)?.image_url && (
                      <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={(vp.product as any).image_url} 
                          alt={vp.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Category:</span>
                        <div className="text-muted-foreground">{vp.product?.category}</div>
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>
                        <div className="text-muted-foreground">₹{vp.price_override || vp.product?.price} / {vp.product?.unit}</div>
                      </div>
                    </div>

                    {/* Time Fields */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Subscribe Before</Label>
                        <Input 
                          type="time" 
                          value={(vp.product as any)?.subscribe_before || ""} 
                          onChange={(e) => handleUpdateTimesImmediate(
                            vp.product.id,
                            e.target.value,
                            (vp.product as any)?.delivery_before || ""
                          )}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Delivery Before</Label>
                        <Input 
                          type="time" 
                          value={(vp.product as any)?.delivery_before || ""} 
                          onChange={(e) => handleUpdateTimesImmediate(
                            vp.product.id,
                            (vp.product as any)?.subscribe_before || "",
                            e.target.value
                          )}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    
                    {vp.product?.description && (
                      <div className="text-sm">
                        <span className="font-medium">Description:</span>
                        <div className="text-muted-foreground">{vp.product.description}</div>
                      </div>
                    )}

                    {/* Stock Toggle Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setStockToggles(prev => ({ ...prev, [vp.id]: !prev[vp.id] }))}
                    >
                      {stockToggles[vp.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {/* STOCK MANAGEMENT SECTION - Conditionally rendered */}
                    {stockToggles[vp.id] && (
                      <div className="border-t pt-3 mt-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-sm bg-muted p-2 rounded">
                          <div>
                            <div className="text-xs text-muted-foreground">Total</div>
                            <div className="font-medium">{vp.stock_quantity || 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Reserved</div>
                            <div className="font-medium text-orange-600">{vp.stock_reserved || 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Available</div>
                            <div className="font-medium text-green-600">{vp.stock_available || 0}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedProductForStock(vp);
                              setStockQuantityToAdd("");
                              setShowStockDialog(true);
                            }}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Additional Stock
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          setSelectedForEdit(vp);
                          setEditForm({
                            name: vp.product?.name || "",
                            category: vp.product?.category || "",
                            unit: vp.product?.unit || "",
                            description: vp.product?.description || "",
                            subscribe_before: (vp.product as any)?.subscribe_before || "",
                            delivery_before: (vp.product as any)?.delivery_before || "",
                            price: vp.price_override?.toString() || vp.product?.price?.toString() || ""
                          });
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeVendorProduct(vp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
                <Label htmlFor="product-name">Product Name and Pack Size *</Label>
                <Input
                  id="product-name"
                  value={newRequest.name}
                  onChange={(e) => setNewRequest({...newRequest, name: e.target.value})}
                  placeholder="Enter product name and pack size"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={newRequest.category} onValueChange={(value) => setNewRequest({...newRequest, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newRequest.price}
                  onChange={(e) => setNewRequest({...newRequest, price: e.target.value})}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={newRequest.unit}
                  onChange={(e) => setNewRequest({...newRequest, unit: e.target.value})}
                  placeholder="Nos"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stock-status-request">Stock Status *</Label>
              <Select 
                value={newRequest.inStock ? "in-stock" : "out-of-stock"} 
                onValueChange={(value) => setNewRequest({ ...newRequest, inStock: value === "in-stock" })}
              >
                <SelectTrigger id="stock-status-request">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
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

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product - {selectedForEdit?.product?.name}</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              Changes to name, category, unit, and description require admin approval. 
              Subscribe/delivery times, images, and price changes apply immediately.
            </AlertDescription>
          </Alert>
          
          {/* Image Upload Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label>Product Image (Updates Immediately)</Label>
            {(selectedForEdit?.product as any)?.image_url && (
              <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={(selectedForEdit.product as any).image_url} 
                  alt={selectedForEdit.product.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0] && selectedForEdit) {
                  setSelectedProductForImage(selectedForEdit.product);
                  handleImageUpload(e);
                }
              }}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-unit">Unit</Label>
              <Input
                id="edit-unit"
                value={editForm.unit}
                onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-subscribe-before">Subscribe Before</Label>
                <Input
                  id="edit-subscribe-before"
                  type="time"
                  value={editForm.subscribe_before}
                  onChange={(e) => setEditForm({...editForm, subscribe_before: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-delivery-before">Delivery Before</Label>
                <Input
                  id="edit-delivery-before"
                  type="time"
                  value={editForm.delivery_before}
                  onChange={(e) => setEditForm({...editForm, delivery_before: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              />
            </div>
            <div className="border-t pt-4">
              <Label htmlFor="edit-price">Price (Applies Immediately)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                />
                <Button
                  onClick={() => {
                    if (selectedForEdit && editForm.price) {
                      setSelectedProductForPrice(selectedForEdit);
                      setNewPrice(editForm.price);
                      setShowPriceDialog(true);
                    }
                  }}
                >
                  Update Price Now
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitEditRequest}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Product Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(selectedProductForImage as any)?.image_url && (
              <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={(selectedProductForImage as any).image_url} 
                  alt={selectedProductForImage?.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Image for {selectedProductForImage?.name}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedProductForStock?.product?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded">
              <div>
                <div className="text-xs text-muted-foreground">Current Stock</div>
                <div className="text-xl font-bold">
                  {selectedProductForStock?.stock_quantity || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reserved</div>
                <div className="text-xl font-bold text-orange-600">
                  {selectedProductForStock?.stock_reserved || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Available</div>
                <div className="text-xl font-bold text-green-600">
                  {selectedProductForStock?.stock_available || 0}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="stockQuantity">Current Additional Stock ({selectedProductForStock?.product?.unit})</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="1"
                  step="1"
                  value={stockQuantityToAdd}
                  onChange={(e) => setStockQuantityToAdd(e.target.value)}
                  placeholder="Current additional stock quantity"
                />
              <p className="text-xs text-muted-foreground mt-1">
                This represents your current additional stock available
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStock}>Add Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Price Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Price - {selectedProductForPrice?.product?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded">
              <div className="text-sm text-muted-foreground">Base Price (Admin Set)</div>
              <div className="text-2xl font-bold">
                ₹{selectedProductForPrice?.product?.price} / {selectedProductForPrice?.product?.unit}
              </div>
            </div>

            <div>
              <Label htmlFor="newPrice">Your Price Override</Label>
              <Input
                id="newPrice"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter your price"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave at 0 or empty to use the base price. This price applies immediately to all new orders.
              </p>
            </div>

            {newPrice && parseFloat(newPrice) > 0 && (
              <div className="p-2 bg-blue-50 rounded text-sm">
                <strong>New price for customers:</strong> ₹{newPrice} / {selectedProductForPrice?.product?.unit}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePriceImmediate}>Update Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
