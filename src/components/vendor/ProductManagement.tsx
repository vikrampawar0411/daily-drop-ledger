import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Package, Milk, Newspaper, Trash2, Upload, Image as ImageIcon, DollarSign, Edit, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
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
  const { vendorProducts, loading: vendorProductsLoading, addVendorProduct, removeVendorProduct, addStock, updateStock, updateStockStatus, updatePrice, refetch } = useVendorProducts(vendorId);
  const { productRequests, loading: requestsLoading, createProductRequest } = useProductRequests(vendorId);
  const { editRequests, createEditRequest } = useProductEditRequests(vendorId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedForEdit, setSelectedForEdit] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [newRequest, setNewRequest] = useState({
    name: "",
    category: "",
    price: "",
    unit: "Nos",
    description: "",
    inStock: true,
    subscribe_before: "23:00",
    delivery_before: "07:00"
  });
  
  // Stock and Price Management States
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<any>(null);
  const [stockQuantityToAdd, setStockQuantityToAdd] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState<any>(null);
  const [activeSubscribersCount, setActiveSubscribersCount] = useState(0);
  
  // Local state for inline editing
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [stockChanged, setStockChanged] = useState<Record<string, boolean>>({});
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    unit: "",
    description: "",
    subscribe_before: "",
    delivery_before: "",
    price_override: "",
    image_url: ""
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
        inStock: true,
        subscribe_before: "23:00",
        delivery_before: "07:00"
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

  const handleToggleActive = async (vp: any) => {
    if (vp.is_active) {
      // Deactivating - fetch active subscribers count first
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('product_id', vp.product_id)
        .eq('vendor_id', vp.vendor_id)
        .eq('status', 'active');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to check subscribers",
          variant: "destructive",
        });
        return;
      }

      setActiveSubscribersCount(subscriptions?.length || 0);
      setProductToDeactivate(vp);
      setShowDeactivateDialog(true);
    } else {
      // Activating - no confirmation needed
      await updateStockStatus(vp.id, true);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!productToDeactivate || !vendorId) return;

    try {
      // Deactivate the product
      await updateStockStatus(productToDeactivate.id, false);

      // Fetch vendor contact details
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('name, phone, email, contact_person')
        .eq('id', vendorId)
        .single();

      const vendorContact = vendorData 
        ? `Contact: ${vendorData.contact_person || vendorData.name}, Phone: ${vendorData.phone || 'N/A'}, Email: ${vendorData.email || 'N/A'}`
        : 'Contact vendor for details';

      // Cancel future subscription orders and create notifications
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('customer_id')
        .eq('product_id', productToDeactivate.product_id)
        .eq('vendor_id', vendorId)
        .eq('status', 'active');

      if (subscriptions && subscriptions.length > 0) {
        // Cancel future orders (orders with status pending and order_date >= today)
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('product_id', productToDeactivate.product_id)
          .eq('vendor_id', vendorId)
          .eq('status', 'pending')
          .gte('order_date', today);

        // Create notifications for each customer
        const notifications = subscriptions.map(sub => ({
          customer_id: sub.customer_id,
          product_id: productToDeactivate.product_id,
          vendor_id: vendorId,
          message: `${productToDeactivate.product?.name} is no longer active. Your future subscribed orders have been cancelled. Please contact the vendor to discuss alternatives.`,
          vendor_contact: vendorContact,
          is_read: false
        }));

        await supabase
          .from('customer_notifications')
          .insert(notifications);

        toast({
          title: "Product deactivated",
          description: `${activeSubscribersCount} customer(s) have been notified`,
        });
      } else {
        toast({
          title: "Product deactivated",
          description: "No active subscriptions to notify",
        });
      }

      setShowDeactivateDialog(false);
      setProductToDeactivate(null);
      setActiveSubscribersCount(0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      
      // Use refetch instead of reload
      refetch();
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
      // Update price immediately if changed
      if (editForm.price_override !== undefined && editForm.price_override !== '') {
        const newPrice = parseFloat(editForm.price_override);
        if (!isNaN(newPrice) && newPrice !== selectedForEdit?.price_override) {
          await updatePrice(selectedForEdit.id, newPrice === 0 ? null : newPrice);
        }
      }

      // Update times immediately if changed
      if (editForm.subscribe_before !== (selectedForEdit?.product as any)?.subscribe_before ||
          editForm.delivery_before !== (selectedForEdit?.product as any)?.delivery_before) {
        await handleUpdateTimesImmediate(
          selectedForEdit.product.id,
          editForm.subscribe_before,
          editForm.delivery_before
        );
      }

      // Submit edit request for name, category, unit, description, and image
      await createEditRequest({
        product_id: selectedForEdit.product.id,
        vendor_id: vendorId,
        requested_by_user_id: user.id,
        proposed_name: editForm.name || undefined,
        proposed_category: editForm.category || undefined,
        proposed_unit: editForm.unit || undefined,
        proposed_description: editForm.description || undefined,
        proposed_image_url: editForm.image_url || undefined,
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
        price_override: "",
        image_url: ""
      });
    } catch (error) {
      // Error handled by hook
    }
  };
  
  const handleImageUploadForApproval = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedForEdit) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pending-${selectedForEdit.product.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Store in editForm for later submission
      setEditForm(prev => ({ ...prev, image_url: publicUrl }));

      toast({
        title: "Image uploaded",
        description: "Image will be applied after admin approval",
      });
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
          <TabsTrigger value="my-products">
            My Products ({vendorProducts.length})
          </TabsTrigger>
          <TabsTrigger value="edit-requests">
            Product Changes Requested ({editRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            New Product Requests ({productRequests.filter(r => r.status === 'pending').length})
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {vp.is_active ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          checked={vp.is_active}
                          onCheckedChange={() => handleToggleActive(vp)}
                        />
                      </div>
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

                    {/* Time Fields - Read Only */}
                    {((vp.product as any)?.subscribe_before || (vp.product as any)?.delivery_before) && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {(vp.product as any)?.subscribe_before && (
                          <div>
                            <span className="text-xs text-muted-foreground">Subscribe Before:</span>
                            <div className="font-medium">{(vp.product as any).subscribe_before}</div>
                          </div>
                        )}
                        {(vp.product as any)?.delivery_before && (
                          <div>
                            <span className="text-xs text-muted-foreground">Delivery Before:</span>
                            <div className="font-medium">{(vp.product as any).delivery_before}</div>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Use Edit button to change times</p>
                    
                    {vp.product?.description && (
                      <div className="text-sm">
                        <span className="font-medium">Description:</span>
                        <div className="text-muted-foreground">{vp.product.description}</div>
                      </div>
                     )}
                     
                     {/* Edit Request Pending Indicator */}
                     {editRequests.some(req => req.product_id === vp.product_id && req.status === 'pending') && (
                       <Alert className="bg-yellow-50 border-yellow-200">
                         <AlertDescription className="text-xs text-yellow-800">
                           ⏳ Edit request pending admin approval
                         </AlertDescription>
                       </Alert>
                     )}

                     {/* STOCK MANAGEMENT SECTION - Always visible */}
                     <div className="border-t pt-3 mt-3 space-y-3">
                       <div className="grid grid-cols-3 gap-2 text-sm bg-muted p-2 rounded">
                         <div>
                           <div className="text-xs text-muted-foreground mb-1">Current Additional Stock</div>
                           <Input
                             type="number"
                             min="0"
                             value={editingStock[vp.id] ?? vp.stock_quantity ?? 0}
                             onChange={(e) => {
                               const newStock = parseInt(e.target.value) || 0;
                               setEditingStock(prev => ({ ...prev, [vp.id]: newStock }));
                               // Mark as changed if different from original
                               setStockChanged(prev => ({ 
                                 ...prev, 
                                 [vp.id]: newStock !== (vp.stock_quantity ?? 0) 
                               }));
                             }}
                             className="h-8 text-center font-medium"
                           />
                         </div>
                         <div>
                           <div className="text-xs text-muted-foreground">Reserved</div>
                           <div className="font-medium text-orange-600 text-center pt-1">{vp.stock_reserved || 0}</div>
                         </div>
                         <div>
                           <div className="text-xs text-muted-foreground">Available</div>
                           <div className="font-medium text-green-600 text-center pt-1">{vp.stock_available || 0}</div>
                         </div>
                       </div>
                       
                       {/* Update Stock Button - Only visible when changed */}
                       {stockChanged[vp.id] && (
                         <Button
                           size="sm"
                           onClick={() => {
                             updateStock(vp.id, editingStock[vp.id]);
                             setStockChanged(prev => ({ ...prev, [vp.id]: false }));
                           }}
                           className="w-full"
                         >
                           Update Stock
                         </Button>
                       )}
                     </div>

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
                            price_override: vp.price_override?.toString() || "",
                            image_url: ""
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

        <TabsContent value="edit-requests" className="space-y-4">
          {editRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No edit requests</p>
                <p className="text-sm text-muted-foreground mt-2">Edit requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editRequests.map((request) => {
                const proposedProduct = {
                  name: request.proposed_name || request.product?.name,
                  category: request.proposed_category || request.product?.category,
                  unit: request.proposed_unit || request.product?.unit,
                  description: request.proposed_description || request.product?.description,
                  subscribe_before: request.proposed_subscribe_before || (request.product as any)?.subscribe_before,
                  delivery_before: request.proposed_delivery_before || (request.product as any)?.delivery_before,
                  image_url: request.proposed_image_url || request.product?.image_url,
                };

                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Edit Request</CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Display as product card with proposed changes */}
                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-start gap-4">
                          {proposedProduct.image_url && (
                            <img 
                              src={proposedProduct.image_url} 
                              alt={proposedProduct.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-lg">{proposedProduct.name}</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Category:</span>
                                <span className="ml-2 font-medium">{proposedProduct.category}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Unit:</span>
                                <span className="ml-2 font-medium">{proposedProduct.unit}</span>
                              </div>
                              {proposedProduct.subscribe_before && (
                                <div>
                                  <span className="text-muted-foreground">Subscribe Before:</span>
                                  <span className="ml-2 font-medium">{proposedProduct.subscribe_before}</span>
                                </div>
                              )}
                              {proposedProduct.delivery_before && (
                                <div>
                                  <span className="text-muted-foreground">Delivery Before:</span>
                                  <span className="ml-2 font-medium">{proposedProduct.delivery_before}</span>
                                </div>
                              )}
                            </div>
                            {proposedProduct.description && (
                              <p className="text-sm text-muted-foreground">{proposedProduct.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t text-xs text-blue-700 dark:text-blue-400 font-medium">
                          ✨ These changes will apply after admin approval
                        </div>
                      </div>

                      {request.admin_notes && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <span className="font-medium">Admin Notes:</span> {request.admin_notes}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="text-xs text-muted-foreground mt-3">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
              Changes to name, category, unit, description, and images require admin approval. 
              Subscribe/delivery times and price changes apply immediately.
            </AlertDescription>
          </Alert>
          
          {/* Image Upload Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label>Product Image (Requires Admin Approval)</Label>
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
              onChange={handleImageUploadForApproval}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            {editForm.image_url && (
              <p className="text-xs text-green-600">✓ New image uploaded (pending approval)</p>
            )}
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
            <div>
              <Label htmlFor="edit-price">Price Override (Updates Immediately)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Default: ₹${selectedForEdit?.product?.price || 0}`}
                value={editForm.price_override || ''}
                onChange={(e) => setEditForm({...editForm, price_override: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use default price. This updates immediately without admin approval.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-subscribe-before">Subscribe Before (Updates Immediately)</Label>
                <Input
                  id="edit-subscribe-before"
                  type="time"
                  value={editForm.subscribe_before}
                  onChange={(e) => setEditForm({...editForm, subscribe_before: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-delivery-before">Delivery Before (Updates Immediately)</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitEditRequest}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Product Deactivation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  {activeSubscribersCount > 0 
                    ? `${activeSubscribersCount} active customer(s) have subscribed to this product.`
                    : "No active subscriptions for this product."}
                </p>
                <p>
                  Do you wish to deactivate this product and notify active customers?
                </p>
                {activeSubscribersCount > 0 && (
                  <p className="mt-2 text-sm">
                    Customers will be notified that their future subscribed orders are cancelled 
                    and will receive your contact details.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeactivate}>
              Deactivate & Notify
            </Button>
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
