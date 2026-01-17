import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
    // State for stepwise add product dialog
    const [addProductCategory, setAddProductCategory] = useState("");
    const [addProductPrice, setAddProductPrice] = useState("");
    const [addProductUnit, setAddProductUnit] = useState("");
    const [addProductSubscriptionTime, setAddProductSubscriptionTime] = useState("");
    const [addProductStockStatus, setAddProductStockStatus] = useState("");
  const { products, loading: productsLoading } = useProducts();
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendorId, setVendorId] = useState<string | undefined>();
  const { vendorProducts, loading: vendorProductsLoading, addVendorProduct, removeVendorProduct, addStock, updateStock, updateStockStatus, updatePrice, getProductStats, refetch } = useVendorProducts(vendorId);
  const { productRequests, loading: requestsLoading, createProductRequest } = useProductRequests(vendorId);
  const { editRequests, createEditRequest } = useProductEditRequests(vendorId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedForEdit, setSelectedForEdit] = useState<any>(null);
  const [selectedForDetails, setSelectedForDetails] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
  const [expandedEditRequests, setExpandedEditRequests] = useState<Set<string>>(new Set());
  
  // Product stats state
  const [productStats, setProductStats] = useState<Record<string, { futureOrdersCount: number; connectedCustomersCount: number }>>({});
  
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

  // Load product stats when vendor products change
  useEffect(() => {
    const loadProductStats = async () => {
      const newStats: Record<string, { futureOrdersCount: number; connectedCustomersCount: number }> = {};
      
      for (const vp of vendorProducts) {
        const stats = await getProductStats(vp.id);
        newStats[vp.id] = stats;
      }
      
      setProductStats(newStats);
    };

    if (vendorProducts.length > 0) {
      loadProductStats();
    }
  }, [vendorProducts, getProductStats]);

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
      // Check if product already added (double-check)
      const alreadyAdded = vendorProducts.some(vp => vp.product_id === selectedProduct);
      if (alreadyAdded) {
        toast({
          title: "Product already added",
          description: "This product is already in your list",
          variant: "destructive",
        });
        return;
      }

      // Verify product still exists and is active
      const productExists = products.some(p => p.id === selectedProduct && p.is_active);
      if (!productExists) {
        toast({
          title: "Product unavailable",
          description: "This product is no longer available. Please refresh and try again.",
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
    if (!vendorId || !user) return;

    try {
      const priceNum = parseFloat(newRequest.price as string) || 0;

      await createProductRequest({
        vendor_id: vendorId,
        requested_by_user_id: user.id,
        name: newRequest.name,
        category: newRequest.category,
        price: priceNum,
        unit: newRequest.unit || "Nos",
        availability: newRequest.inStock ? "in_stock" : "out_of_stock",
        description: newRequest.description || null,
      } as any);

      setShowRequestDialog(false);
      setNewRequest({
        name: "",
        category: "",
        price: "",
        unit: "Nos",
        description: "",
        inStock: true,
        subscribe_before: "23:00",
        delivery_before: "07:00",
      });
    } catch (error) {
      // handled by hook
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

  const handleToggleActive = async (vp: any) => {
    try {
      // Check for active subscribers before deactivating
      if (vp.is_active) {
        // Check subscription count (skip complex query due to TypeScript limitations)
        setActiveSubscribersCount(0);
        setProductToDeactivate(vp);
        setShowDeactivateDialog(true);
      } else {
        // Activating the product
        await updateStockStatus(vp.id, true);
        toast({
          title: "Product activated",
          description: "Product is now active and visible to customers",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error toggling product status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!productToDeactivate) return;
    
    try {
      await updateStockStatus(productToDeactivate.id, false);
      
      // TODO: Notify customers if there are active subscriptions
      if (activeSubscribersCount > 0) {
        // Send notifications to subscribers
      }
      
      setShowDeactivateDialog(false);
      setProductToDeactivate(null);
      toast({
        title: "Product deactivated",
        description: "Product is now inactive and hidden from customers",
      });
    } catch (error: any) {
      toast({
        title: "Error deactivating product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateTimesImmediate = async (productId: string, subscribeBefore: string, deliveryBefore: string) => {
    try {
      // Update the product times directly in the database
      const { error } = await supabase
        .from('products')
        .update({
          subscribe_before: subscribeBefore || null,
          delivery_before: deliveryBefore || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Times updated",
        description: "Subscribe and delivery times have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating times",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePriceImmediate = async () => {
    if (!selectedProductForPrice || !newPrice) return;
    
    try {
      const priceValue = parseFloat(newPrice);
      if (isNaN(priceValue) || priceValue < 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }
      
      await updatePrice(selectedProductForPrice.id, priceValue === 0 ? null : priceValue);
      setShowPriceDialog(false);
      setSelectedProductForPrice(null);
      setNewPrice("");
      toast({
        title: "Price updated",
        description: "Price has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating price",
        description: error.message,
        variant: "destructive",
      });
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
    (p) => p.is_active && !vendorProducts.some((vp) => vp.product_id === p.id)
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
      </div>

      {/* UNIFIED VIEW: All product information in one place */}
      <div className="space-y-6">
        {/* MY PRODUCTS SECTION */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span className="text-lg font-semibold">My Products ({vendorProducts.length})</span>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Existing Product
            </Button>
          </CardHeader>
          <CardContent>
            {vendorProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No products added yet</p>
                <p className="text-sm text-muted-foreground mt-2">Add products from the master list to start</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorProducts.map((vp) => (
                  <Card key={vp.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                    {/* Product Image */}
                    <div className="relative w-full h-40 bg-gray-100">
                      {(vp.product as any)?.image_url ? (
                        <img 
                          src={(vp.product as any).image_url} 
                          alt={vp.product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {/* Active Status Badge */}
                      <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1 text-xs font-medium">
                        {vp.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <CardContent className="flex-1 flex flex-col p-4 space-y-3">
                      {/* Product Name */}
                      <div>
                        <h3 className="font-semibold text-base line-clamp-2">{vp.product?.name}</h3>
                      </div>

                      {/* Category and Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{vp.product?.category}</span>
                        <span className="text-lg font-bold text-primary">₹{vp.price_override || vp.product?.price}</span>
                      </div>

                      {/* Stats */}
                      {productStats[vp.id] && (
                        <div className="flex gap-2 text-xs">
                          <div className="bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded flex-1 text-center">
                            <div className="text-blue-700 dark:text-blue-400 font-medium">{productStats[vp.id].connectedCustomersCount} Customers</div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded flex-1 text-center">
                            <div className="text-purple-700 dark:text-purple-400 font-medium">{productStats[vp.id].futureOrdersCount} Orders</div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 mt-auto">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedForDetails(vp);
                            setShowDetailsDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
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
          </CardContent>
        </Card>

        {/* EDIT REQUESTS SECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Product Changes Requested ({editRequests.filter(r => r.status === 'pending').length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No edit requests</p>
                <p className="text-sm text-muted-foreground mt-2">Edit requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group requests by product */}
                {Array.from(
                  editRequests.reduce((map, req) => {
                    const key = req.product_id;
                    if (!map.has(key)) {
                      map.set(key, []);
                    }
                    map.get(key)!.push(req);
                    return map;
                  }, new Map<string, typeof editRequests>())
                ).map(([productId, requests]) => {
                  const latestRequest = requests[0];
                  const isExpanded = expandedEditRequests.has(productId);
                  const pendingCount = requests.filter(r => r.status === 'pending').length;
                  
                  const proposedProduct = {
                    name: latestRequest.proposed_name || latestRequest.product?.name,
                    category: latestRequest.proposed_category || latestRequest.product?.category,
                    unit: latestRequest.proposed_unit || latestRequest.product?.unit,
                    description: latestRequest.proposed_description || latestRequest.product?.description,
                    subscribe_before: latestRequest.proposed_subscribe_before || (latestRequest.product as any)?.subscribe_before,
                    delivery_before: latestRequest.proposed_delivery_before || (latestRequest.product as any)?.delivery_before,
                    image_url: latestRequest.proposed_image_url || latestRequest.product?.image_url,
                  };

                  return (
                    <Card key={productId} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            {proposedProduct.image_url && (
                              <img 
                                src={proposedProduct.image_url} 
                                alt={proposedProduct.name}
                                className="w-24 h-24 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <CardTitle className="text-lg">{proposedProduct.name}</CardTitle>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-2">
                                <div>
                                  <span className="text-muted-foreground text-xs">Category</span>
                                  <div className="font-medium">{proposedProduct.category}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Unit</span>
                                  <div className="font-medium">{proposedProduct.unit}</div>
                                </div>
                                {proposedProduct.subscribe_before && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Subscribe Before</span>
                                    <div className="font-medium">{proposedProduct.subscribe_before}</div>
                                  </div>
                                )}
                                {proposedProduct.delivery_before && (
                                  <div>
                                    <span className="text-muted-foreground text-xs">Delivery Before</span>
                                    <div className="font-medium">{proposedProduct.delivery_before}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(latestRequest.status)}
                            {pendingCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {pendingCount} pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {proposedProduct.description && (
                        <div className="px-6 py-2 border-t bg-muted/30">
                          <p className="text-sm text-muted-foreground">{proposedProduct.description}</p>
                        </div>
                      )}

                      {latestRequest.admin_notes && (
                        <Alert className="mx-6 mt-3 mb-0">
                          <AlertDescription className="text-xs">
                            <span className="font-medium">Admin Notes:</span> {latestRequest.admin_notes}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* More Details Button */}
                      <CardContent className="pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setExpandedEditRequests(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(productId)) {
                                newSet.delete(productId);
                              } else {
                                newSet.add(productId);
                              }
                              return newSet;
                            });
                          }}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Show Details & History
                            </>
                          )}
                        </Button>
                      </CardContent>

                      {/* Expanded Details - Change History */}
                      {isExpanded && (
                        <div className="border-t bg-muted/50 p-6 space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Change History</h4>
                            <p className="text-xs text-muted-foreground">
                              {requests.length > 0 && (
                                <>
                                  From {new Date(requests[requests.length - 1].created_at).toLocaleDateString()} to {new Date(requests[0].created_at).toLocaleDateString()}
                                </>
                              )}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              💡 Note: Price changes apply immediately and are not tracked in change requests. Only fields requiring admin approval appear below.
                            </p>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {requests.map((request, idx) => {
                              const changedFields = [];
                              const actualChanges: any = {};
                              
                              // Check for actual changes (not just presence of proposed value)
                              if (request.proposed_name && request.proposed_name !== latestRequest.product?.name) {
                                changedFields.push('Name');
                                actualChanges.name = true;
                              }
                              if (request.proposed_category && request.proposed_category !== latestRequest.product?.category) {
                                changedFields.push('Category');
                                actualChanges.category = true;
                              }
                              if (request.proposed_unit && request.proposed_unit !== latestRequest.product?.unit) {
                                changedFields.push('Unit');
                                actualChanges.unit = true;
                              }
                              if (request.proposed_subscribe_before && request.proposed_subscribe_before !== (latestRequest.product as any)?.subscribe_before) {
                                changedFields.push('Subscribe Before');
                                actualChanges.subscribe_before = true;
                              }
                              if (request.proposed_delivery_before && request.proposed_delivery_before !== (latestRequest.product as any)?.delivery_before) {
                                changedFields.push('Delivery Before');
                                actualChanges.delivery_before = true;
                              }
                              if (request.proposed_image_url) {
                                changedFields.push('Image');
                                actualChanges.image = true;
                              }
                              
                              return (
                                <div key={request.id} className="border rounded-lg p-3 bg-white dark:bg-slate-950">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 px-2 py-1 rounded">
                                        Request #{idx + 1}
                                      </span>
                                      {getStatusBadge(request.status)}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(request.created_at).toLocaleDateString()}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Changed fields indicator */}
                                  {changedFields.length > 0 && (
                                    <div className="mb-2 pb-2 border-b">
                                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                        📝 Changes: {changedFields.join(', ')}
                                      </p>
                                    </div>
                                  )}

                                  {/* Proposed changes details - Only show actual changes */}
                                  <div className="space-y-2 text-sm">
                                    {actualChanges.name && (
                                      <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                            {latestRequest.product?.name}
                                          </span>
                                          <span className="text-xs">→</span>
                                          <span className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium">
                                            {request.proposed_name}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {actualChanges.category && (
                                      <div>
                                        <span className="text-muted-foreground">Category:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                            {latestRequest.product?.category}
                                          </span>
                                          <span className="text-xs">→</span>
                                          <span className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium">
                                            {request.proposed_category}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {actualChanges.unit && (
                                      <div>
                                        <span className="text-muted-foreground">Unit:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                            {latestRequest.product?.unit}
                                          </span>
                                          <span className="text-xs">→</span>
                                          <span className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium">
                                            {request.proposed_unit}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {actualChanges.subscribe_before && (
                                      <div>
                                        <span className="text-muted-foreground">Subscribe Before:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                            {(latestRequest.product as any)?.subscribe_before}
                                          </span>
                                          <span className="text-xs">→</span>
                                          <span className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium">
                                            {request.proposed_subscribe_before}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {actualChanges.delivery_before && (
                                      <div>
                                        <span className="text-muted-foreground">Delivery Before:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                                            {(latestRequest.product as any)?.delivery_before}
                                          </span>
                                          <span className="text-xs">→</span>
                                          <span className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium">
                                            {request.proposed_delivery_before}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {actualChanges.image && (
                                      <div>
                                        <span className="text-muted-foreground">Image:</span>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ New image uploaded</p>
                                      </div>
                                    )}
                                  </div>

                                  {request.admin_notes && (
                                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs border border-blue-200 dark:border-blue-800">
                                      <span className="font-medium">💬 Admin Notes:</span> {request.admin_notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NEW PRODUCT REQUESTS SECTION */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="text-lg font-semibold">New Product Requests ({productRequests.filter(r => r.status === 'pending').length})</span>
            </div>
            <Button variant="outline" onClick={() => setShowRequestDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Request New Product
            </Button>
          </CardHeader>
          <CardContent>
            {productRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No product requests</p>
                <p className="text-sm text-muted-foreground mt-2">Request new products for admin approval</p>
              </div>
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
          </CardContent>
        </Card>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product from Master List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Step 1: Select Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <Select
                value={addProductCategory || ""}
                onValueChange={v => {
                  setAddProductCategory(v);
                  setSelectedProduct("");
                }}
              >
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
            {/* Step 2: Select Product (filtered by category) */}
            <div>
              <label className="block text-sm font-medium mb-1">Product *</label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                disabled={!addProductCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={addProductCategory ? (availableProducts.filter((product) => product.category === addProductCategory).length ? "Select a product" : "No products in this category") : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.filter((product) => product.category === addProductCategory).length === 0 && addProductCategory ? (
                    <div className="px-3 py-2 text-muted-foreground">No products found in this category</div>
                  ) : (
                    availableProducts
                      .filter((product) => product.category === addProductCategory)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Step 3: Price, Unit, Subscription Time, Stock Status */}
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={addProductPrice || ""}
                    onChange={e => setAddProductPrice(e.target.value)}
                    placeholder="Enter price"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={addProductUnit || ""}
                    onChange={e => setAddProductUnit(e.target.value)}
                    placeholder="e.g. Litre, Piece, Kg"
                  />
                </div>
                <div>
                  <Label htmlFor="subscriptionTime">Subscription Time *</Label>
                  <Input
                    id="subscriptionTime"
                    value={addProductSubscriptionTime || ""}
                    onChange={e => setAddProductSubscriptionTime(e.target.value)}
                    placeholder="e.g. Morning, Evening, 7am-9am"
                  />
                </div>
                <div>
                  <Label htmlFor="stockStatus">Stock Status (optional)</Label>
                  <Input
                    id="stockStatus"
                    value={addProductStockStatus || ""}
                    onChange={e => setAddProductStockStatus(e.target.value)}
                    placeholder="e.g. In Stock, Out of Stock"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddProduct}
              disabled={
                !selectedProduct || !addProductCategory || !addProductPrice || !addProductUnit || !addProductSubscriptionTime
              }
            >
              Add Product
            </Button>
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
                disabled
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value})} disabled>
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

      {/* View Product Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForDetails?.product?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedForDetails && (
            <div className="space-y-6">
              {/* Image */}
              {(selectedForDetails.product as any)?.image_url && (
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={(selectedForDetails.product as any).image_url} 
                    alt={selectedForDetails.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Category</div>
                  <div className="font-semibold">{selectedForDetails.product?.category}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Your Price</div>
                  <div className="font-semibold text-lg text-primary">₹{selectedForDetails.price_override || selectedForDetails.product?.price}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1">Unit</div>
                  <div className="font-semibold">{selectedForDetails.product?.unit}</div>
                </div>
              </div>

              {/* Description */}
              {selectedForDetails.product?.description && (
                <div>
                  <div className="text-sm font-medium mb-2">Description</div>
                  <p className="text-sm text-muted-foreground">{selectedForDetails.product.description}</p>
                </div>
              )}

              {/* Time Fields */}
              {((selectedForDetails.product as any)?.subscribe_before || (selectedForDetails.product as any)?.delivery_before) && (
                <div className="grid grid-cols-2 gap-4">
                  {(selectedForDetails.product as any)?.subscribe_before && (
                    <div>
                      <div className="text-sm font-medium mb-1">Subscribe Before</div>
                      <div className="text-sm text-muted-foreground">{(selectedForDetails.product as any).subscribe_before}</div>
                    </div>
                  )}
                  {(selectedForDetails.product as any)?.delivery_before && (
                    <div>
                      <div className="text-sm font-medium mb-1">Delivery Before</div>
                      <div className="text-sm text-muted-foreground">{(selectedForDetails.product as any).delivery_before}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Info */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-3">Stock Information</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <div className="text-xs text-muted-foreground mb-1">Current Stock</div>
                    <div className="text-lg font-bold">{selectedForDetails.stock_quantity || 0}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded">
                    <div className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-medium">Reserved</div>
                    <div className="text-lg font-bold text-orange-600">{selectedForDetails.stock_reserved || 0}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded">
                    <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">Available</div>
                    <div className="text-lg font-bold text-green-600">{selectedForDetails.stock_available || 0}</div>
                  </div>
                </div>
              </div>

              {/* Customer & Order Stats */}
              {productStats[selectedForDetails.id] && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Customer Orders</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                      <div className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Connected Customers</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{productStats[selectedForDetails.id].connectedCustomersCount}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded">
                      <div className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">Future Orders</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">{productStats[selectedForDetails.id].futureOrdersCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Request Status */}
              {editRequests.some(req => req.product_id === selectedForDetails.product_id && req.status === 'pending') && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm text-yellow-800">
                    ⏳ You have a pending edit request for this product awaiting admin approval
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button 
              variant="default"
              className="flex-1"
              onClick={() => {
                setSelectedForEdit(selectedForDetails);
                setEditForm({
                  name: selectedForDetails.product?.name || "",
                  category: selectedForDetails.product?.category || "",
                  unit: selectedForDetails.product?.unit || "",
                  description: selectedForDetails.product?.description || "",
                  subscribe_before: (selectedForDetails.product as any)?.subscribe_before || "",
                  delivery_before: (selectedForDetails.product as any)?.delivery_before || "",
                  price_override: selectedForDetails.price_override?.toString() || "",
                  image_url: ""
                });
                setShowDetailsDialog(false);
                setShowEditDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
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
