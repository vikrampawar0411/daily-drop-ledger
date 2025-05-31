
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Package, Milk, Newspaper } from "lucide-react";

const ProductManagement = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Fresh Milk",
      category: "Milk",
      price: 25,
      unit: "per litre",
      availability: "Daily",
      description: "Fresh cow milk delivered daily",
      isActive: true
    },
    {
      id: 2,
      name: "Times of India",
      category: "Newspaper",
      price: 5,
      unit: "per copy",
      availability: "Daily",
      description: "English daily newspaper",
      isActive: true
    },
    {
      id: 3,
      name: "Organic Milk",
      category: "Milk",
      price: 35,
      unit: "per litre",
      availability: "Daily",
      description: "Organic milk from local farms",
      isActive: true
    },
    {
      id: 4,
      name: "Maharashtra Times",
      category: "Newspaper",
      price: 4,
      unit: "per copy",
      availability: "Daily",
      description: "Marathi daily newspaper",
      isActive: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    availability: "",
    description: ""
  });

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.price) {
      const product = {
        id: products.length + 1,
        ...newProduct,
        price: parseFloat(newProduct.price),
        isActive: true
      };
      setProducts([...products, product]);
      setNewProduct({
        name: "",
        category: "",
        price: "",
        unit: "",
        availability: "",
        description: ""
      });
      setShowAddForm(false);
    }
  };

  const toggleProductStatus = (id: number) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, isActive: !product.isActive } : product
    ));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getProductIcon(product.category)}
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </div>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Category:</span>
                  <div className="text-gray-600">{product.category}</div>
                </div>
                <div>
                  <span className="font-medium">Price:</span>
                  <div className="text-gray-600">₹{product.price} {product.unit}</div>
                </div>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Availability:</span>
                <div className="text-gray-600">{product.availability}</div>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Description:</span>
                <div className="text-gray-600">{product.description}</div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant={product.isActive ? "outline" : "default"}
                  onClick={() => toggleProductStatus(product.id)}
                  className="flex-1"
                >
                  {product.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductManagement;
