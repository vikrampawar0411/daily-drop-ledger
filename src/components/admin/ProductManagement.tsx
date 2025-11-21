import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Package, Milk, Newspaper, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_CATEGORIES = ["Milk", "Newspaper", "Grocery", "Vegetables", "Fruits", "Other"];

const ProductManagement = () => {
  const { products, loading: productsLoading, addProduct, updateProduct } = useProducts();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedProductForImage, setSelectedProductForImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    unit: "Nos",
    description: "",
    inStock: true
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
        subscribe_before: null,
        delivery_before: null,
      });

      setNewProduct({
        name: "",
        category: "",
        price: "",
        unit: "Nos",
        description: "",
        inStock: true
      });
      setShowAddDialog(false);
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
      const filePath = `products/${fileName}`;

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

      toast({
        title: "Success",
        description: "Product image uploaded successfully",
      });

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
            <CardContent>
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
              ) : (
                <div className="w-full h-40 bg-muted rounded-md mb-4 flex items-center justify-center">
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
                {product.description && (
                  <p className="text-muted-foreground text-xs mt-2">{product.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  setSelectedProductForImage(product);
                  setShowImageDialog(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {product.image_url ? "Change Image" : "Add Image"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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

      {/* Upload Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Product Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an image for {selectedProductForImage?.name}
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)} disabled={uploading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
