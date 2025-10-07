
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Phone, Plus, Check } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { useProducts } from "@/hooks/useProducts";

const VendorDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useProducts();

  const vendorsWithProducts = useMemo(() => {
    return vendors.map(vendor => {
      const vendorProducts = products.filter(p => p.vendor_id === vendor.id && p.is_active);
      return {
        ...vendor,
        products: vendorProducts
      };
    });
  }, [vendors, products]);

  const categories = useMemo(() => {
    return [...new Set(vendors.map(v => v.category))];
  }, [vendors]);

  const filteredVendors = vendorsWithProducts.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.address?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;
    
    return matchesSearch && matchesCategory && vendor.is_active;
  });

  if (vendorsLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Vendor Directory</h2>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Request New Vendor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Find Vendors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendor List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{vendor.name}</CardTitle>
                <Badge variant="secondary">{vendor.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {vendor.address && (
                  <div className="flex items-center space-x-2 col-span-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">{vendor.address}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.contact_person && (
                  <div className="text-sm">
                    <span className="font-medium">Contact:</span> {vendor.contact_person}
                  </div>
                )}
              </div>

              {vendor.products.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Products & Pricing:</span>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {vendor.products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm">{product.name}</span>
                        <span className="text-sm font-medium">₹{product.price} / {product.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                  Place Order
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No vendors found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorDirectory;
