
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Users, Phone } from "lucide-react";

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedSociety, setSelectedSociety] = useState("all");

  const customers = [
    {
      id: 1,
      name: "Rajesh Sharma",
      phone: "+91 98765 43210",
      area: "Bandra West",
      society: "Sea View Apartments",
      wing: "A",
      flatNo: "402",
      products: ["Milk", "Newspaper"],
      status: "Active"
    },
    {
      id: 2,
      name: "Priya Patel",
      phone: "+91 87654 32109",
      area: "Andheri East",
      society: "Green Valley Society",
      wing: "B",
      flatNo: "305",
      products: ["Milk"],
      status: "Active"
    },
    {
      id: 3,
      name: "Amit Kumar",
      phone: "+91 76543 21098",
      area: "Powai",
      society: "Lake View Heights",
      wing: "C",
      flatNo: "701",
      products: ["Newspaper"],
      status: "Inactive"
    },
    {
      id: 4,
      name: "Sunita Joshi",
      phone: "+91 65432 10987",
      area: "Bandra West",
      society: "Sea View Apartments",
      wing: "B",
      flatNo: "503",
      products: ["Milk", "Newspaper"],
      status: "Active"
    }
  ];

  const areas = ["Bandra West", "Andheri East", "Powai", "Goregaon West", "Malad East"];
  const societies = ["Sea View Apartments", "Green Valley Society", "Lake View Heights", "Sunrise Complex"];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.flatNo.includes(searchTerm) ||
                         customer.phone.includes(searchTerm);
    const matchesArea = selectedArea === "all" || customer.area === selectedArea;
    const matchesSociety = selectedSociety === "all" || customer.society === selectedSociety;
    
    return matchesSearch && matchesArea && matchesSociety;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Users className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
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
            <Select value={selectedSociety} onValueChange={setSelectedSociety}>
              <SelectTrigger>
                <SelectValue placeholder="Select society" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Societies</SelectItem>
                {societies.map(society => (
                  <SelectItem key={society} value={society}>{society}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedArea("all");
              setSelectedSociety("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{customer.name}</CardTitle>
                <Badge variant={customer.status === "Active" ? "default" : "secondary"}>
                  {customer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{customer.area}</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">{customer.society}</div>
                <div className="text-gray-600">Wing {customer.wing}, Flat {customer.flatNo}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {customer.products.map((product) => (
                  <Badge key={product} variant="outline" className="text-xs">
                    {product}
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerManagement;
