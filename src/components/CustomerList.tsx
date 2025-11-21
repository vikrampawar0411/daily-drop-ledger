
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Phone, Milk, Newspaper } from "lucide-react";

const CustomerList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      address: "123 MG Road, Sector 15",
      phone: "+91 9876543210",
      milkQuantity: 1,
      newspaper: true,
      route: "Route A",
      status: "active"
    },
    {
      id: 2,
      name: "Priya Sharma",
      address: "456 Park Street, Block B",
      phone: "+91 9876543211",
      milkQuantity: 2,
      newspaper: false,
      route: "Route A",
      status: "active"
    },
    {
      id: 3,
      name: "Mohammad Ali",
      address: "789 Gandhi Nagar",
      phone: "+91 9876543212",
      milkQuantity: 0,
      newspaper: true,
      route: "Route B",
      status: "active"
    }
  ]);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    address: "",
    phone: "",
    milkQuantity: 0,
    newspaper: false,
    route: "Route A"
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCustomer = () => {
    const customer = {
      id: customers.length + 1,
      ...newCustomer,
      status: "active"
    };
    setCustomers([...customers, customer]);
    setNewCustomer({
      name: "",
      address: "",
      phone: "",
      milkQuantity: 0,
      newspaper: false,
      route: "Route A"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage your delivery routes and customers</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  placeholder="Enter delivery address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="milk">Milk Quantity (litres)</Label>
                  <Input
                    id="milk"
                    type="number"
                    min="0"
                    step="1"
                    value={newCustomer.milkQuantity}
                    onChange={(e) => setNewCustomer({...newCustomer, milkQuantity: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="route">Route</Label>
                  <Select value={newCustomer.route} onValueChange={(value) => setNewCustomer({...newCustomer, route: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Route A">Route A</SelectItem>
                      <SelectItem value="Route B">Route B</SelectItem>
                      <SelectItem value="Route C">Route C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="newspaper"
                  checked={newCustomer.newspaper}
                  onChange={(e) => setNewCustomer({...newCustomer, newspaper: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="newspaper">Newspaper subscription</Label>
              </div>
              <Button onClick={addCustomer} className="w-full">Add Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{customer.name}</CardTitle>
                <Badge variant="secondary">{customer.route}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{customer.address}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  {customer.milkQuantity > 0 && (
                    <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      <Milk className="h-3 w-3" />
                      <span>{customer.milkQuantity}L</span>
                    </div>
                  )}
                  {customer.newspaper && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      <Newspaper className="h-3 w-3" />
                      <span>Paper</span>
                    </div>
                  )}
                </div>
                <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                  {customer.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No customers found</div>
          <p className="text-gray-500 mt-2">Try adjusting your search or add a new customer</p>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
