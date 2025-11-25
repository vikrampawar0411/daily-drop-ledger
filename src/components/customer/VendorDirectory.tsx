
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, MapPin, Phone, Plus, Check, X, Info, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useVendorConnections } from "@/hooks/useVendorConnections";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import { useSubscriptions } from "@/hooks/useSubscriptions";

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
  onNavigate?: (tab: string, params?: any) => void;
}

const VendorDirectory = ({ onNavigate }: VendorDirectoryProps = {}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { products: allProducts, loading: productsLoading } = useProducts();
  const { vendorProducts, loading: vendorProductsLoading } = useVendorProducts();
  const { 
    connectedVendorIds,
    isConnected, 
    connectToVendor, 
    disconnectFromVendor, 
    loading: connectionsLoading 
  } = useVendorConnections();
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();

  // Fetch all active vendors for browsing
  useEffect(() => {
    const fetchAllVendors = async () => {
      try {
        const { data, error } = await supabase
          .from("vendors")
          .select("id, name, category, contact_person, phone, email, address, is_active, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching vendors:", error);
          setVendors([]);
        } else {
          setVendors(data || []);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setVendors([]);
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
          if (!product) return null;
          
          return {
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            unit: product.unit,
            availability: product.availability,
            price: vp.price_override || product.price,
            image_url: product.image_url,
            subscribe_before: product.subscribe_before || null,
            delivery_before: product.delivery_before || null,
          };
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
    const matchesConnection = !showConnectedOnly || connectedVendorIds.includes(vendor.id);
    
    return matchesSearch && matchesCategory && matchesConnection && vendor.is_active;
  });

  if (vendorsLoading || productsLoading || vendorProductsLoading || connectionsLoading || subscriptionsLoading) {
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

  const handleViewDetails = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowDetailsDialog(true);
  };

  const getProductSubscriptionStatus = (productId: string, vendorId: string) => {
    const subscription = subscriptions.find(
      sub => sub.product_id === productId && 
             sub.vendor_id === vendorId && 
             (sub.status === 'active' || sub.status === 'paused')
    );
    return subscription;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {showConnectedOnly ? `Showing ${filteredVendors.length} connected vendors` : 'Browse all vendors'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showConnectedOnly ? "default" : "outline"}
            onClick={() => setShowConnectedOnly(!showConnectedOnly)}
          >
            <Check className="h-4 w-4 mr-2" />
            {showConnectedOnly ? 'Show All' : 'Connected Only'}
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              window.open('mailto:support@example.com?subject=New Vendor Request&body=Please provide vendor details...', '_blank');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Request New Vendor
          </Button>
        </div>
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
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-xl">{vendor.name}</CardTitle>
                  {isConnected(vendor.id) && (
                    <Badge className="mt-1" variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="self-start">{vendor.category}</Badge>
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
                       <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg px-3 py-2 gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{product.name}</span>
                            <span className="text-sm text-primary font-semibold">₹{product.price} / {product.unit}</span>
                          </div>
                          {(product.subscribe_before || product.delivery_before) && (
                            <div className="flex gap-2 mt-1">
                              {product.subscribe_before && (
                                <Badge variant="outline" className="text-xs">Subscribe: {product.subscribe_before}</Badge>
                              )}
                              {product.delivery_before && (
                                <Badge variant="outline" className="text-xs">Delivery: {product.delivery_before}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleViewDetails(vendor)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </Button>
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

      {/* Vendor Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedVendor?.name}</DialogTitle>
            <DialogDescription>
              Complete product catalog and vendor information
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-6">
              {/* Vendor Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Category</span>
                  <p className="text-base">{selectedVendor.category}</p>
                </div>
                {selectedVendor.contact_person && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Contact Person</span>
                    <p className="text-base">{selectedVendor.contact_person}</p>
                  </div>
                )}
                {selectedVendor.phone && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Phone</span>
                    <p className="text-base">{selectedVendor.phone}</p>
                  </div>
                )}
                {selectedVendor.email && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                    <p className="text-base">{selectedVendor.email}</p>
                  </div>
                )}
                {selectedVendor.address && (
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">Address</span>
                    <p className="text-base">{selectedVendor.address}</p>
                  </div>
                )}
              </div>

              {/* Products */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Products</h3>
                {selectedVendor.products.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedVendor.products.map((product: any) => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Product Image */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-base truncate">{product.name}</h4>
                                <Badge variant="secondary" className="flex-shrink-0">{product.category}</Badge>
                              </div>
                              {product.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm mb-3">
                                <span className="text-muted-foreground">Availability: <span className="font-medium text-foreground">{product.availability}</span></span>
                                <span className="text-muted-foreground">Unit: <span className="font-medium text-foreground">{product.unit}</span></span>
                              </div>
                              {(product.subscribe_before || product.delivery_before) && (
                                <div className="flex gap-2 mb-3">
                                  {product.subscribe_before && (
                                    <Badge variant="outline" className="text-xs">
                                      📅 Subscribe by: {product.subscribe_before}
                                    </Badge>
                                  )}
                                  {product.delivery_before && (
                                    <Badge variant="secondary" className="text-xs">
                                      🚚 Delivery by: {product.delivery_before}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-2xl font-bold text-primary">₹{product.price}</div>
                                  <div className="text-xs text-muted-foreground">per {product.unit}</div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      setShowDetailsDialog(false);
                                      onNavigate?.('dashboard', { 
                                        vendorId: selectedVendor.id,
                                        productId: product.id 
                                      });
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Order Now
                                  </Button>
                                  {(() => {
                                    const existingSubscription = getProductSubscriptionStatus(product.id, selectedVendor.id);
                                    
                                    if (existingSubscription) {
                                      return (
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                          onClick={() => {
                                            setShowDetailsDialog(false);
                                            onNavigate?.('subscriptions', {
                                              highlightSubscriptionId: existingSubscription.id
                                            });
                                          }}
                                        >
                                          {existingSubscription.status === 'paused' ? 'Paused' : 'Subscribed'} ✓
                                        </Button>
                                      );
                                    }
                                    
                                    return (
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setShowDetailsDialog(false);
                                          onNavigate?.('subscriptions', {
                                            vendorId: selectedVendor.id,
                                            productId: product.id
                                          });
                                        }}
                                      >
                                        Subscribe
                                      </Button>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No products available from this vendor</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant={isConnected(selectedVendor.id) ? "destructive" : "default"}
                  onClick={() => {
                    handleVendorConnection(selectedVendor.id);
                    setShowDetailsDialog(false);
                  }}
                  className="flex-1"
                >
                  {isConnected(selectedVendor.id) ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Disconnect from Vendor
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Connect with Vendor
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorDirectory;
