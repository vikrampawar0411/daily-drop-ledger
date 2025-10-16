
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Phone, Plus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useVendorConnections } from "@/hooks/useVendorConnections";
import { useVendorProducts } from "@/hooks/useVendorProducts";

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

interface VendorDirectoryProps {
  onNavigate?: (tab: string) => void;
}

const VendorDirectory = ({ onNavigate }: VendorDirectoryProps = {}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const { products: allProducts, loading: productsLoading } = useProducts();
  const { vendorProducts, loading: vendorProductsLoading } = useVendorProducts();
  const { 
    isConnected, 
    connectToVendor, 
    disconnectFromVendor, 
    loading: connectionsLoading 
  } = useVendorConnections();

  // Fetch all active vendors for browsing
  useEffect(() => {
    const fetchAllVendors = async () => {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setVendors(data || []);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setVendorsLoading(false);
      }
    };

    fetchAllVendors();
  }, []);

  const vendorsWithProducts = useMemo(() => {
    return vendors.map(vendor => {
      // Get vendor-specific products
      const vendorSpecificProducts = vendorProducts
        .filter(vp => vp.vendor_id === vendor.id && vp.is_active)
        .map(vp => {
          const product = allProducts.find(p => p.id === vp.product_id);
          return product ? {
            ...product,
            price: vp.price_override || product.price
          } : null;
        })
        .filter(p => p !== null);
      
      return {
        ...vendor,
        products: vendorSpecificProducts
      };
    });
  }, [vendors, allProducts, vendorProducts]);

  const categories = useMemo(() => {
    return [...new Set(vendors.map(v => v.category))];
  }, [vendors]);

  const filteredVendors = vendorsWithProducts.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.address?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;
    
    return matchesSearch && matchesCategory && vendor.is_active;
  });

  if (vendorsLoading || productsLoading || vendorProductsLoading || connectionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  const handleVendorConnection = async (vendorId: string) => {
    if (isConnected(vendorId)) {
      await disconnectFromVendor(vendorId);
    } else {
      await connectToVendor(vendorId);
    }
  };

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
                <div>
                  <CardTitle className="text-xl">{vendor.name}</CardTitle>
                  {isConnected(vendor.id) && (
                    <Badge className="mt-1" variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
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
                <Button 
                  size="sm" 
                  className="flex-1"
                  variant={isConnected(vendor.id) ? "destructive" : "default"}
                  onClick={() => handleVendorConnection(vendor.id)}
                >
                  {isConnected(vendor.id) ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
                {isConnected(vendor.id) && (
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onNavigate?.('calendar')}
                  >
                    Place Order
                  </Button>
                )}
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
