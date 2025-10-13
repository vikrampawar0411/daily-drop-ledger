
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Milk, Newspaper } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";

const ProductManagement = () => {
  const { products, loading, addProduct, toggleProductStatus } = useProducts();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    availability: "Daily",
    description: ""
  });

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.category && newProduct.price) {
      try {
        await addProduct({
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          unit: newProduct.unit,
          availability: newProduct.availability,
          description: newProduct.description || null,
          status: 'active'
        });
        setNewProduct({
          name: "",
          category: "",
          price: "",
          unit: "",
          availability: "Daily",
          description: ""
        });
        setShowAddForm(false);
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

  if (loading) {
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
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Milk">Milk</SelectItem>
                    <SelectItem value="Newspaper">Newspaper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <Input
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  placeholder="e.g., per litre, per copy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Availability</label>
                <Select value={newProduct.availability} onValueChange={(value) => setNewProduct({...newProduct, availability: value})}>
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
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Enter product description"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddProduct}>Add Product</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm text-muted-foreground mt-2">Get started by adding your first product</p>
          </CardContent>
        </Card>
      ) : (
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
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Category:</span>
                    <div className="text-muted-foreground">{product.category}</div>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <div className="text-muted-foreground">₹{product.price} {product.unit}</div>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Availability:</span>
                  <div className="text-muted-foreground">{product.availability}</div>
                </div>
                
                {product.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span>
                    <div className="text-muted-foreground">{product.description}</div>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant={product.is_active ? "outline" : "default"}
                    onClick={() => toggleProductStatus(product.id)}
                    className="flex-1"
                  >
                    {product.is_active ? "Deactivate" : "Activate"}
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

export default ProductManagement;
