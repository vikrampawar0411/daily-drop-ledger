import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Milk, Newspaper, Shield, Store, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStates } from "@/hooks/useStates";
import { useCities } from "@/hooks/useCities";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";

const VENDOR_CATEGORIES = [
  "Milk & Dairy",
  "Newspaper & Magazines",
  "Groceries",
  "Vegetables & Fruits",
  "Water Supply",
  "Gas Cylinder",
  "Cleaning Services",
  "Other",
];

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });

  // Customer signup form data
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    state_id: "",
    city_id: "",
    area_id: "",
    society_id: "",
    wing_number: "",
    flat_plot_house_number: "",
  });

  // Vendor signup form data
  const [vendorForm, setVendorForm] = useState({
    businessName: "",
    category: "",
    contactPerson: "",
    phone: "",
    businessEmail: "",
    address: "",
  });

  // For cascading dropdowns in customer form
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const { states } = useStates();
  const { cities } = useCities(selectedStateId);
  const { areas } = useAreas();
  const { societies } = useSocieties(selectedAreaId);

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: recordByUserId } = await supabase
        .from('customers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!recordByUserId) {
        const { data: recordByEmail } = await supabase
          .from('customers')
          .select('id, user_id, email')
          .eq('email', user.email)
          .maybeSingle();

        if (recordByEmail && !recordByEmail.user_id) {
          await supabase
            .from('customers')
            .update({ user_id: user.id })
            .eq('id', recordByEmail.id);

          navigate("/");
          setIsLoading(false);
          return;
        } else if (!recordByEmail) {
          await supabase.auth.signOut();
          toast({
            title: "Account Not Found",
            description: "No customer account found with this email. Please sign up or select the correct role.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
    }

    navigate("/");
    setIsLoading(false);
  };

  const handleVendorSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: recordByUserId } = await supabase
        .from('vendors')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!recordByUserId) {
        const { data: recordByEmail } = await supabase
          .from('vendors')
          .select('id, user_id, email')
          .eq('email', user.email)
          .maybeSingle();

        if (recordByEmail && !recordByEmail.user_id) {
          await supabase
            .from('vendors')
            .update({ user_id: user.id })
            .eq('id', recordByEmail.id);

          navigate("/");
          setIsLoading(false);
          return;
        } else if (!recordByEmail) {
          await supabase.auth.signOut();
          toast({
            title: "Account Not Found",
            description: "No vendor account found with this email. Please sign up or select the correct role.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
    }

    navigate("/");
    setIsLoading(false);
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(
        adminCredentials.username, 
        adminCredentials.password
      );
      
      if (signInError) {
        toast({
          title: "Authentication Failed",
          description: signInError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (!isAdmin) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You do not have admin privileges",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Welcome Admin!",
          description: "You have successfully signed in.",
        });

        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !customerForm.name || !customerForm.phone || 
        !customerForm.state_id || !customerForm.city_id || !customerForm.area_id || 
        !customerForm.society_id || !customerForm.flat_plot_house_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, 'customer', {
      name: customerForm.name,
      phone: customerForm.phone,
      area_id: customerForm.area_id,
      society_id: customerForm.society_id,
      wing_number: customerForm.wing_number,
      flat_plot_house_number: customerForm.flat_plot_house_number,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
      setEmail('');
      setPassword('');
      setCustomerForm({
        name: "",
        phone: "",
        state_id: "",
        city_id: "",
        area_id: "",
        society_id: "",
        wing_number: "",
        flat_plot_house_number: "",
      });
    }
  };

  const handleVendorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !vendorForm.businessName || !vendorForm.category || 
        !vendorForm.contactPerson || !vendorForm.phone || !vendorForm.address) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, 'vendor', {
      businessName: vendorForm.businessName,
      category: vendorForm.category,
      contactPerson: vendorForm.contactPerson,
      phone: vendorForm.phone,
      businessEmail: vendorForm.businessEmail,
      address: vendorForm.address,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmail('');
      setPassword('');
      setVendorForm({
        businessName: "",
        category: "",
        contactPerson: "",
        phone: "",
        businessEmail: "",
        address: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-3 rounded-lg inline-flex mb-4">
            <Milk className="h-8 w-8" />
            <Newspaper className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Drop Ledger</h1>
          <p className="text-gray-600 mt-2">Vendor-Customer Distribution Platform</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mt-3">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <Card className="max-h-[90vh] overflow-y-auto">
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">
                <Users className="h-4 w-4 mr-1" />
                Customer
              </TabsTrigger>
              <TabsTrigger value="vendor">
                <Store className="h-4 w-4 mr-1" />
                Vendor
              </TabsTrigger>
              <TabsTrigger value="admin">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </TabsTrigger>
            </TabsList>

            {/* Customer Tab */}
            <TabsContent value="customer">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-4 mt-4" style={{ width: 'calc(100% - 2rem)' }}>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <CardHeader className="pt-4">
                    <CardTitle>Customer Sign In</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your customer account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCustomerSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer-signin-email">Email</Label>
                        <Input
                          id="customer-signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-signin-password">Password</Label>
                        <Input
                          id="customer-signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In as Customer"}
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>

                <TabsContent value="signup">
                  <CardHeader className="pt-4">
                    <CardTitle>Customer Sign Up</CardTitle>
                    <CardDescription>
                      Create a new customer account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCustomerSignup}>
                      <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="customer-email">Email *</Label>
                            <Input
                              id="customer-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-password">Password *</Label>
                            <Input
                              id="customer-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={6}
                            />
                            <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-name">Full Name *</Label>
                            <Input
                              id="customer-name"
                              value={customerForm.name}
                              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                              placeholder="Your full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-phone">Phone Number *</Label>
                            <Input
                              id="customer-phone"
                              type="tel"
                              value={customerForm.phone}
                              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                              placeholder="Your phone number"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-state">State *</Label>
                            <Select
                              value={customerForm.state_id}
                              onValueChange={(value) => {
                                setCustomerForm({ ...customerForm, state_id: value, city_id: "", area_id: "", society_id: "" });
                                setSelectedStateId(value);
                              }}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your state" />
                              </SelectTrigger>
                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state.id} value={state.id}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-city">City *</Label>
                            <Select
                              value={customerForm.city_id}
                              onValueChange={(value) => {
                                setCustomerForm({ ...customerForm, city_id: value, area_id: "", society_id: "" });
                                setSelectedCityId(value);
                              }}
                              disabled={!selectedStateId}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your city" />
                              </SelectTrigger>
                              <SelectContent>
                                {cities.map((city) => (
                                  <SelectItem key={city.id} value={city.id}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-area">Area *</Label>
                            <Select
                              value={customerForm.area_id}
                              onValueChange={(value) => {
                                setCustomerForm({ ...customerForm, area_id: value, society_id: "" });
                                setSelectedAreaId(value);
                              }}
                              disabled={!selectedCityId}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your area" />
                              </SelectTrigger>
                              <SelectContent>
                                {areas.filter(a => a.city_id === selectedCityId).map((area) => (
                                  <SelectItem key={area.id} value={area.id}>
                                    {area.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-society">Society Name *</Label>
                            <Select
                              value={customerForm.society_id}
                              onValueChange={(value) => setCustomerForm({ ...customerForm, society_id: value })}
                              disabled={!selectedAreaId}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your society" />
                              </SelectTrigger>
                              <SelectContent>
                                {societies.map((society) => (
                                  <SelectItem key={society.id} value={society.id}>
                                    {society.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-wing">Wing Number</Label>
                            <Input
                              id="customer-wing"
                              value={customerForm.wing_number}
                              onChange={(e) => setCustomerForm({ ...customerForm, wing_number: e.target.value })}
                              placeholder="Wing number (optional)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customer-flat">Flat / Plot / House Number *</Label>
                            <Input
                              id="customer-flat"
                              value={customerForm.flat_plot_house_number}
                              onChange={(e) => setCustomerForm({ ...customerForm, flat_plot_house_number: e.target.value })}
                              placeholder="Flat / Plot / House number"
                              required
                            />
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="pt-4 border-t mt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creating account..." : "Create Customer Account"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Vendor Tab */}
            <TabsContent value="vendor">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-4 mt-4" style={{ width: 'calc(100% - 2rem)' }}>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <CardHeader className="pt-4">
                    <CardTitle>Vendor Sign In</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your vendor account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVendorSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendor-signin-email">Email</Label>
                        <Input
                          id="vendor-signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vendor-signin-password">Password</Label>
                        <Input
                          id="vendor-signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In as Vendor"}
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>

                <TabsContent value="signup">
                  <CardHeader className="pt-4">
                    <CardTitle>Vendor Sign Up</CardTitle>
                    <CardDescription>
                      Create a new vendor account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVendorSignup}>
                      <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="vendor-email">Email *</Label>
                            <Input
                              id="vendor-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-password">Password *</Label>
                            <Input
                              id="vendor-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={6}
                            />
                            <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-business-name">Business Name *</Label>
                            <Input
                              id="vendor-business-name"
                              value={vendorForm.businessName}
                              onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                              placeholder="Your business name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-category">Business Category *</Label>
                            <Select
                              value={vendorForm.category}
                              onValueChange={(value) => setVendorForm({ ...vendorForm, category: value })}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {VENDOR_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-contact-person">Contact Person Name *</Label>
                            <Input
                              id="vendor-contact-person"
                              value={vendorForm.contactPerson}
                              onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                              placeholder="Primary contact person"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-phone">Phone Number *</Label>
                            <Input
                              id="vendor-phone"
                              type="tel"
                              value={vendorForm.phone}
                              onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                              placeholder="Business phone number"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-business-email">Business Email</Label>
                            <Input
                              id="vendor-business-email"
                              type="email"
                              value={vendorForm.businessEmail}
                              onChange={(e) => setVendorForm({ ...vendorForm, businessEmail: e.target.value })}
                              placeholder="Business email address (optional)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor-address">Business Address *</Label>
                            <Textarea
                              id="vendor-address"
                              value={vendorForm.address}
                              onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                              placeholder="Complete business address"
                              rows={3}
                              required
                            />
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="pt-4 border-t mt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creating account..." : "Create Vendor Account"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-red-600" />
                  Admin Login
                </CardTitle>
                <CardDescription>
                  Administrator access only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Email</Label>
                    <Input
                      id="admin-username"
                      type="email"
                      placeholder="admin@dailydropledger.com"
                      value={adminCredentials.username}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" variant="outline" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In as Admin"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
