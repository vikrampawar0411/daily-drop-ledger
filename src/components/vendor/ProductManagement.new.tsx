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
        subscribe_before: newRequest.subscribe_before,
        delivery_before: newRequest.delivery_before,
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
                       
*** End File