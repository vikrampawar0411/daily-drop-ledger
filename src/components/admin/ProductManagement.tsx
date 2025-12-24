import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Plus, Package, Milk, Newspaper, Upload, Image as ImageIcon, Edit, CheckCircle, XCircle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useProductRequests } from "@/hooks/useProductRequests";
import { useProductEditRequests } from "@/hooks/useProductEditRequests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_CATEGORIES = ["Milk", "Newspaper", "Grocery", "Vegetables", "Fruits", "Other"];

const ProductManagement = () => {
  const { products, loading: productsLoading, addProduct, updateProduct } = useProducts();
  const { productRequests, approveProductRequest, rejectProductRequest } = useProductRequests();
  const { editRequests, approveEditRequest, rejectEditRequest } = useProductEditRequests();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showProductRequestDialog, setShowProductRequestDialog] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any>(null);
  const [selectedProductRequest, setSelectedProductRequest] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  
  const [productRequestForm, setProductRequestForm] = useState({
    name: "",
    category: "",
    price: "",
    unit: "Nos",
    description: "",
    availability: "in_stock",
    subscribe_before: "23:00",
    delivery_before: "07:00",
    images: [] as string[]
  });
  
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    unit: "Nos",
    description: "",
    inStock: true,
    subscribe_before: "23:00",
    delivery_before: "07:00"
  });

  const [editProduct, setEditProduct] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    description: "",
    subscribe_before: "",
    delivery_before: "",
    images: [] as string[]
  });

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if product name already exists
    const existingProduct = products.find(p => 
      p.name.toLowerCase().trim() === newProduct.name.toLowerCase().trim()
    );
    if (existingProduct) {
      toast({
        title: "Duplicate product",
        description: "A product with this name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      await addProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        unit: newProduct.unit,
        availability: "Daily",
        description: newProduct.description || null,
        status: "active",
        is_active: newProduct.inStock,
        image_url: null,
        subscribe_before: newProduct.subscribe_before || null,
        delivery_before: newProduct.delivery_before || null,
      });

      setNewProduct({
        name: "",
        category: "",
        price: "",
        unit: "Nos",
        description: "",
        inStock: true,
        subscribe_before: "23:00",
        delivery_before: "07:00"
      });
      setShowAddDialog(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProductForEdit || !editProduct.name || !editProduct.category || !editProduct.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProduct(selectedProductForEdit.id, {
        name: editProduct.name,
        category: editProduct.category,
        price: parseFloat(editProduct.price),
        unit: editProduct.unit,
        description: editProduct.description || null,
        subscribe_before: editProduct.subscribe_before || null,
        delivery_before: editProduct.delivery_before || null,
        image_url: editProduct.images.length > 0 ? editProduct.images[0] : null,
      } as any);

      setShowEditDialog(false);
      setSelectedProductForEdit(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequestForReview || !user) return;
    
    try {
      // Apply image change if proposed
      if (selectedRequestForReview.proposed_image_url) {
        await supabase
          .from('products')
          .update({ image_url: selectedRequestForReview.proposed_image_url })
          .eq('id', selectedRequestForReview.product_id);
      }

      await approveEditRequest(selectedRequestForReview.id, user.id, adminNotes);
      setShowReviewDialog(false);
      setSelectedRequestForReview(null);
      setAdminNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequestForReview || !user || !adminNotes) {
      toast({
        title: "Missing information",
        description: "Please provide rejection notes",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await rejectEditRequest(selectedRequestForReview.id, user.id, adminNotes);
      setShowReviewDialog(false);
      setSelectedRequestForReview(null);
      setAdminNotes("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setEditProduct({ 
        ...editProduct, 
        images: [...editProduct.images, publicUrl] 
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      // Reset file input
      event.target.value = '';
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

  const handleProductRequestImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-request-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setProductRequestForm({ 
        ...productRequestForm, 
        images: [...productRequestForm.images, publicUrl] 
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      // Reset file input
      event.target.value = '';
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

  const handleApproveProductRequest = async () => {
    if (!selectedProductRequest) return;

    try {
      const priceNum = parseFloat(productRequestForm.price);
      if (isNaN(priceNum)) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      // Create the product with modified details
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert([{
          name: productRequestForm.name,
          category: productRequestForm.category,
          price: priceNum,
          unit: productRequestForm.unit,
          availability: productRequestForm.availability,
          description: productRequestForm.description || null,
          subscribe_before: productRequestForm.subscribe_before,
          delivery_before: productRequestForm.delivery_before,
          image_url: productRequestForm.images.length > 0 ? productRequestForm.images[0] : null,
          images: productRequestForm.images.length > 0 ? productRequestForm.images : null,
          status: "active",
        }])
        .select()
        .single();

      if (productError) throw productError;

      // Automatically add the product to the requesting vendor's list
      const { error: vendorProductError } = await supabase
        .from("vendor_products")
        .insert([{
          vendor_id: selectedProductRequest.vendor_id,
          product_id: newProduct.id,
          is_active: true,
        }]);

      if (vendorProductError) throw vendorProductError;

      // Update the request status
      const { error: updateError } = await supabase
        .from("product_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes || null,
          reviewed_by_user_id: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedProductRequest.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Product request approved and added to master list",
      });

      setShowProductRequestDialog(false);
      setSelectedProductRequest(null);
      setAdminNotes("");
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error approving product request",
        description: error.message,
        variant: "destructive",
      });
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

  if (productsLoading) {
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
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="product-requests">
            New Product Requests ({productRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="edit-requests">
            Edit Requests ({editRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getProductIcon(product.category)}
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {((product as any).images?.length > 0 || product.image_url) ? (
                    <div className="relative">
                      {(product as any).images?.length > 1 ? (
                        <Carousel className="w-full">
                          <CarouselContent>
                            {(product as any).images.map((img: string, idx: number) => (
                              <CarouselItem key={idx}>
                                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                                  <img 
                                    src={img} 
                                    alt={`${product.name} ${idx + 1}`}
                                    className="w-full h-48 object-contain"
                                  />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {(product as any).images.length} photos
                          </div>
                        </Carousel>
                      ) : (
                        <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={(product as any).images?.[0] || product.image_url} 
                            alt={product.name}
                            className="w-full h-48 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">₹{product.price}/{product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Availability:</span>
                      <span className="font-medium text-xs">{product.availability}</span>
                    </div>
                    {(product.subscribe_before || product.delivery_before) && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {product.subscribe_before && (
                          <div>
                            <span className="text-muted-foreground">Subscribe:</span>
                            <div className="font-medium">{product.subscribe_before}</div>
                          </div>
                        )}
                        {product.delivery_before && (
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>
                            <div className="font-medium">{product.delivery_before}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {product.description && (
                      <p className="text-muted-foreground text-xs mt-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedProductForEdit(product);
                        setEditProduct({
                          name: product.name,
                          category: product.category,
                          price: product.price.toString(),
                          unit: product.unit,
                          description: product.description || "",
                          subscribe_before: product.subscribe_before || "",
                          delivery_before: product.delivery_before || "",
                          images: (product as any).images || (product.image_url ? [product.image_url] : []),
                        });
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="product-requests" className="space-y-4">
          {productRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No product requests</p>
                <p className="text-sm text-muted-foreground mt-2">Vendor product requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {productRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{request.name}</CardTitle>
                      <Badge variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Vendor:</span>
                        <div className="text-muted-foreground">{request.vendor?.name}</div>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <div className="text-muted-foreground">{request.category}</div>
                      </div>
                      <div>
                        <span className="font-medium">Price:</span>
                        <div className="text-muted-foreground">₹{request.price} / {request.unit}</div>
                      </div>
                      <div>
                        <span className="font-medium">Availability:</span>
                        <div className="text-muted-foreground">{request.availability}</div>
                      </div>
                    </div>
                    
                    {request.description && (
                      <div className="text-sm">
                        <span className="font-medium">Description:</span>
                        <div className="text-muted-foreground">{request.description}</div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                    </div>

                    {request.admin_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Admin Notes:</span>
                        <div className="text-muted-foreground">{request.admin_notes}</div>
                      </div>
                    )}
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedProductRequest(request);
                            setProductRequestForm({
                              name: request.name,
                              category: request.category,
                              price: request.price.toString(),
                              unit: request.unit,
                              description: request.description || "",
                              availability: request.availability,
                              subscribe_before: "23:00",
                              delivery_before: "07:00",
                              images: []
                            });
                            setAdminNotes("");
                            setShowProductRequestDialog(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Review & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            const notes = prompt("Enter rejection reason:");
                            if (notes) {
                              await rejectProductRequest(request.id, notes);
                            }
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
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
                <p className="text-sm text-muted-foreground mt-2">Vendor edit requests will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {editRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Edit Request for: {request.product?.name}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Current Values</div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Name: {request.product?.name}</div>
                          <div>Category: {request.product?.category}</div>
                          <div>Unit: {request.product?.unit}</div>
                          <div>Description: {request.product?.description || "N/A"}</div>
                          <div>Subscribe Before: {request.product?.subscribe_before || "N/A"}</div>
                          <div>Delivery Before: {request.product?.delivery_before || "N/A"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Proposed Changes</div>
                        <div className="space-y-1 text-sm">
                          {request.proposed_name && (
                            <div className="font-medium text-blue-600">Name: {request.proposed_name}</div>
                          )}
                          {request.proposed_category && (
                            <div className="font-medium text-blue-600">Category: {request.proposed_category}</div>
                          )}
                          {request.proposed_unit && (
                            <div className="font-medium text-blue-600">Unit: {request.proposed_unit}</div>
                          )}
                          {request.proposed_description !== null && (
                            <div className="font-medium text-blue-600">Description: {request.proposed_description}</div>
                          )}
                          {request.proposed_subscribe_before && (
                            <div className="font-medium text-blue-600">Subscribe Before: {request.proposed_subscribe_before}</div>
                          )}
                          {request.proposed_delivery_before && (
                            <div className="font-medium text-blue-600">Delivery Before: {request.proposed_delivery_before}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Requested by:</span> {request.vendor?.name}
                      <span className="text-muted-foreground ml-2">
                        on {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {request.admin_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Admin Notes:</span>
                        <div className="text-muted-foreground">{request.admin_notes}</div>
                      </div>
                    )}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequestForReview(request);
                            setAdminNotes("");
                            setShowReviewDialog(true);
                          }}
                        >
                          Review Request
                        </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name and Pack Size *</Label>
              <Input
                id="name"
                placeholder="Enter product name and pack size"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  placeholder="Nos"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscribe-before">Subscribe Before Time</Label>
                <Input
                  id="subscribe-before"
                  type="time"
                  value={newProduct.subscribe_before}
                  onChange={(e) => setNewProduct({ ...newProduct, subscribe_before: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="delivery-before">Delivery Before Time</Label>
                <Input
                  id="delivery-before"
                  type="time"
                  value={newProduct.delivery_before}
                  onChange={(e) => setNewProduct({ ...newProduct, delivery_before: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stock-status">Stock Status *</Label>
              <Select 
                value={newProduct.inStock ? "in-stock" : "out-of-stock"} 
                onValueChange={(value) => setNewProduct({ ...newProduct, inStock: value === "in-stock" })}
              >
                <SelectTrigger id="stock-status">
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
                placeholder="Product description (optional)"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label>Product Images (Multiple)</Label>
              {editProduct.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {editProduct.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 border">
                        <img 
                          src={imageUrl} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditProduct({
                            ...editProduct,
                            images: editProduct.images.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editProduct.images.length === 0 
                    ? "Add product images (first image will be primary)" 
                    : `${editProduct.images.length} image(s) added`}
                </p>
              </div>
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>

            <div>
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={editProduct.category} onValueChange={(value) => setEditProduct({ ...editProduct, category: value })}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit *</Label>
                <Input
                  id="edit-unit"
                  value={editProduct.unit}
                  onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-subscribe-before">Subscribe Before Time</Label>
                <Input
                  id="edit-subscribe-before"
                  type="time"
                  value={editProduct.subscribe_before}
                  onChange={(e) => setEditProduct({ ...editProduct, subscribe_before: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-delivery-before">Delivery Before Time</Label>
                <Input
                  id="edit-delivery-before"
                  type="time"
                  value={editProduct.delivery_before}
                  onChange={(e) => setEditProduct({ ...editProduct, delivery_before: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editProduct.description}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateProduct}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Request Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Edit Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for this decision..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectRequest}
              disabled={!adminNotes}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button onClick={handleApproveRequest}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Product Request Dialog */}
      <Dialog open={showProductRequestDialog} onOpenChange={setShowProductRequestDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review & Approve Product Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><strong>Vendor:</strong> {selectedProductRequest?.vendor?.name}</p>
              <p className="text-muted-foreground mt-1">Review and modify the product details before approval</p>
            </div>

            {/* Image Upload Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label>Product Images (Multiple)</Label>
              {productRequestForm.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {productRequestForm.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 border">
                        <img 
                          src={imageUrl} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setProductRequestForm({
                            ...productRequestForm,
                            images: productRequestForm.images.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProductRequestImageUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {productRequestForm.images.length === 0 
                    ? "Add product images (first image will be primary)" 
                    : `${productRequestForm.images.length} image(s) added`}
                </p>
              </div>
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="request-name">Product Name and Pack Size *</Label>
                <Input
                  id="request-name"
                  value={productRequestForm.name}
                  onChange={(e) => setProductRequestForm({...productRequestForm, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="request-category">Category *</Label>
                <Select 
                  value={productRequestForm.category} 
                  onValueChange={(value) => setProductRequestForm({...productRequestForm, category: value})}
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
              <div>
                <Label htmlFor="request-price">Price *</Label>
                <Input
                  id="request-price"
                  type="number"
                  step="0.01"
                  value={productRequestForm.price}
                  onChange={(e) => setProductRequestForm({...productRequestForm, price: e.target.value})}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <Label htmlFor="request-unit">Unit *</Label>
                <Input
                  id="request-unit"
                  value={productRequestForm.unit}
                  onChange={(e) => setProductRequestForm({...productRequestForm, unit: e.target.value})}
                  placeholder="Nos, kg, litre, etc."
                />
              </div>
              <div>
                <Label htmlFor="request-availability">Availability *</Label>
                <Select 
                  value={productRequestForm.availability} 
                  onValueChange={(value) => setProductRequestForm({...productRequestForm, availability: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="request-subscribe">Subscribe Before</Label>
                <Input
                  id="request-subscribe"
                  type="time"
                  value={productRequestForm.subscribe_before}
                  onChange={(e) => setProductRequestForm({...productRequestForm, subscribe_before: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="request-delivery">Delivery Before</Label>
                <Input
                  id="request-delivery"
                  type="time"
                  value={productRequestForm.delivery_before}
                  onChange={(e) => setProductRequestForm({...productRequestForm, delivery_before: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="request-description">Description</Label>
              <Textarea
                id="request-description"
                value={productRequestForm.description}
                onChange={(e) => setProductRequestForm({...productRequestForm, description: e.target.value})}
                placeholder="Enter product description"
              />
            </div>
            <div>
              <Label htmlFor="approval-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductRequestDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleApproveProductRequest}
              disabled={!productRequestForm.name || !productRequestForm.category || !productRequestForm.price || !productRequestForm.unit}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
