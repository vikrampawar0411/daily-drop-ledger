
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Star, Phone, Plus, Check } from "lucide-react";

const VendorDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const vendors = [
    {
      id: 1,
      name: "Fresh Dairy Co.",
      area: "Bandra West",
      products: [
        { name: "Fresh Milk", price: 25, unit: "per litre" },
        { name: "Organic Milk", price: 35, unit: "per litre" }
      ],
      rating: 4.8,
      reviews: 124,
      phone: "+91 98765 43210",
      deliveryTime: "6:00 AM - 8:00 AM",
      isConnected: true
    },
    {
      id: 2,
      name: "News Express",
      area: "Bandra West",
      products: [
        { name: "Times of India", price: 5, unit: "per copy" },
        { name: "Maharashtra Times", price: 4, unit: "per copy" },
        { name: "Economic Times", price: 6, unit: "per copy" }
      ],
      rating: 4.6,
      reviews: 89,
      phone: "+91 87654 32109",
      deliveryTime: "5:30 AM - 7:00 AM",
      isConnected: true
    },
    {
      id: 3,
      name: "Daily Essentials",
      area: "Andheri East",
      products: [
        { name: "Fresh Milk", price: 23, unit: "per litre" },
        { name: "Indian Express", price: 5, unit: "per copy" }
      ],
      rating: 4.5,
      reviews: 67,
      phone: "+91 76543 21098",
      deliveryTime: "6:30 AM - 8:30 AM",
      isConnected: false
    },
    {
      id: 4,
      name: "Morning Supplies",
      area: "Powai",
      products: [
        { name: "Fresh Milk", price: 26, unit: "per litre" },
        { name: "Times of India", price: 5, unit: "per copy" },
        { name: "Hindu", price: 6, unit: "per copy" }
      ],
      rating: 4.7,
      reviews: 156,
      phone: "+91 65432 10987",
      deliveryTime: "5:45 AM - 7:30 AM",
      isConnected: false
    }
  ];

  const areas = ["Bandra West", "Andheri East", "Powai", "Goregaon West", "Malad East"];
  const productTypes = ["Milk", "Newspaper"];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === "all" || vendor.area === selectedArea;
    const matchesProduct = selectedProduct === "all" || 
                          vendor.products.some(product => 
                            product.name.toLowerCase().includes(selectedProduct.toLowerCase())
                          );
    
    return matchesSearch && matchesArea && matchesProduct;
  });

  const handleConnectVendor = (vendorId: number) => {
    // Handle vendor connection logic here
    console.log(`Connecting to vendor ${vendorId}`);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {productTypes.map(product => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedArea("all");
              setSelectedProduct("all");
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
                {vendor.isConnected && (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span>{vendor.area}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span>{vendor.phone}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{vendor.rating}</span>
                </div>
                <span className="text-sm text-gray-600">({vendor.reviews} reviews)</span>
              </div>

              <div>
                <span className="text-sm font-medium">Delivery Time:</span>
                <div className="text-gray-600">{vendor.deliveryTime}</div>
              </div>

              <div>
                <span className="text-sm font-medium">Products & Pricing:</span>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {vendor.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm">{product.name}</span>
                      <span className="text-sm font-medium">₹{product.price} {product.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                {vendor.isConnected ? (
                  <>
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                      Place Order
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleConnectVendor(vendor.id)}
                    >
                      Connect
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorDirectory;
