import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Milk, Newspaper, Shield, Store, Users, Calendar, CheckCircle2, Info, Loader2, X } from "lucide-react";
import { useAreaAvailability } from "@/hooks/useAreaAvailability";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useStates } from "@/hooks/useStates";
import { useCities } from "@/hooks/useCities";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { 
  customerSignupSchema, 
  vendorSignupSchema,
  type CustomerSignupFormData,
  type VendorSignupFormData 
} from "@/lib/validation";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { ValidatedInput } from "@/components/auth/ValidatedInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

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

const Auth = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor'>(() => {
    const saved = localStorage.getItem('selectedRole');
    return (saved === 'customer' || saved === 'vendor') ? saved : 'customer';
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Save selected role to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedRole', selectedRole);
  }, [selectedRole]);
  
  // Get redirect URL from query params (for post-auth navigation)
  const redirectUrl = searchParams.get("redirect") || null;

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

  // Initialize react-hook-form for customer signup with Zod validation
  const customerSignupForm = useForm<CustomerSignupFormData>({
    resolver: zodResolver(customerSignupSchema),
    mode: "onBlur", // Validate on blur for better UX
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      country_code: "+91",
      phone: "",
      state_id: "",
      city_id: "",
      area_id: "",
      society_id: "",
      wing_number: "",
      flat_plot_house_number: "",
    },
  });

  // Initialize react-hook-form for vendor signup with Zod validation
  const vendorSignupForm = useForm<VendorSignupFormData>({
    resolver: zodResolver(vendorSignupSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      category: "",
      contactPerson: "",
      country_code: "+91",
      phone: "",
      businessEmail: "",
      address: "",
    },
  });

  // Watch form values for duplicate checking and password strength analysis
  const customerEmail = customerSignupForm.watch("email");
  const customerCountryCode = customerSignupForm.watch("country_code");
  const customerPhone = customerSignupForm.watch("phone");
  const customerPassword = customerSignupForm.watch("password");
  const vendorEmail = vendorSignupForm.watch("email");
  const vendorCountryCode = vendorSignupForm.watch("country_code");
  const vendorPhone = vendorSignupForm.watch("phone");
  const vendorPassword = vendorSignupForm.watch("password");

  // Combine country code with phone number for duplicate checking
  const customerFullPhone = customerPhone ? `${customerCountryCode} ${customerPhone}` : "";
  const vendorFullPhone = vendorPhone ? `${vendorCountryCode} ${vendorPhone}` : "";

  // Duplicate check hooks with debouncing (500ms)
  const customerDuplicateCheck = useDuplicateCheck(customerEmail, customerFullPhone, 500, isSignUp && selectedRole === 'customer');
  const vendorDuplicateCheck = useDuplicateCheck(vendorEmail, vendorFullPhone, 500, isSignUp && selectedRole === 'vendor');

  // Check area availability for customer signup (check if vendors exist)
  const customerAreaAvailability = useAreaAvailability(
    customerSignupForm.watch("area_id"),
    'customer',
    500,
    isSignUp && selectedRole === 'customer'
  );

  // Note: For vendor signup, we'll show general service info since vendors serve all areas

  // Set custom validation errors for duplicate email/phone
  useEffect(() => {
    if (customerDuplicateCheck.result?.emailExists) {
      customerSignupForm.setError("email", {
        type: "manual",
        message: `Email already registered as ${customerDuplicateCheck.result.existsInTable === 'vendors' ? 'vendor' : 'customer'}`,
      });
    }
    if (customerDuplicateCheck.result?.phoneExists) {
      customerSignupForm.setError("phone", {
        type: "manual",
        message: `Phone number already registered as ${customerDuplicateCheck.result.existsInTable === 'vendors' ? 'vendor' : 'customer'}`,
      });
    }
  }, [customerDuplicateCheck.result]);

  useEffect(() => {
    if (vendorDuplicateCheck.result?.emailExists) {
      vendorSignupForm.setError("email", {
        type: "manual",
        message: `Email already registered as ${vendorDuplicateCheck.result.existsInTable === 'vendors' ? 'vendor' : 'customer'}`,
      });
    }
    if (vendorDuplicateCheck.result?.phoneExists) {
      vendorSignupForm.setError("phone", {
        type: "manual",
        message: `Phone number already registered as ${vendorDuplicateCheck.result.existsInTable === 'vendors' ? 'vendor' : 'customer'}`,
      });
    }
  }, [vendorDuplicateCheck.result]);

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
        // First check if user is admin
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (isAdmin) {
          toast({
            title: "Welcome Admin!",
            description: "You have successfully signed in.",
          });
          navigate(redirectUrl || "/");
          setIsLoading(false);
          return;
        }

        // If not admin, proceed with role-based check
        const tableName = selectedRole === 'customer' ? 'customers' : 'vendors';
        
        const { data: recordByUserId } = await supabase
          .from(tableName)
          .select('id, user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!recordByUserId) {
          const { data: recordByEmail } = await supabase
            .from(tableName)
            .select('id, user_id, email')
            .eq('email', user.email)
            .maybeSingle();

          if (recordByEmail && !recordByEmail.user_id) {
            await supabase
              .from(tableName)
              .update({ user_id: user.id })
              .eq('id', recordByEmail.id);

            navigate(redirectUrl || "/");
            setIsLoading(false);
            return;
          } else if (!recordByEmail) {
            await supabase.auth.signOut();
            toast({
              title: "Account Not Found",
              description: `No ${selectedRole} account found with this email. Please sign up or select the correct role.`,
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }

        navigate(redirectUrl || "/");
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

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail) {
      toast({ title: "Enter email", description: "Please enter your email to reset password", variant: "destructive" });
      return;
    }

    setForgotLoading(true);
    try {
      const redirectTo = window.location.origin + "/";
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo });
      if (error) throw error;
      toast({ title: "Reset email sent", description: "Check your inbox for password reset instructions." });
      setShowForgotDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCustomerSignup = async (data: CustomerSignupFormData) => {
    // Double-check for duplicate email/phone before submitting
    if (customerDuplicateCheck.result?.emailExists || customerDuplicateCheck.result?.phoneExists) {
      toast({
        title: "Validation Error",
        description: "Email or phone number already registered. Please use different credentials.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Combine country code with phone number
    const fullPhone = `${data.country_code} ${data.phone}`;
    const { error } = await signUp(data.email, data.password, 'customer', {
      name: data.name,
      phone: fullPhone,
      area_id: data.area_id,
      society_id: data.society_id,
      wing_number: data.wing_number || "",
      flat_plot_house_number: data.flat_plot_house_number,
    });
    setIsLoading(false);

    if (error) {
      // Show error toast on failure
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Show success toast on successful signup
      toast({
        title: "Account Created Successfully!",
        description: "Your customer account has been created. You can now sign in.",
      });
      // Switch to sign-in view after successful signup
      setIsSignUp(false);
    }
    
    // Clear all form fields after signup attempt (success or failure)
    customerSignupForm.reset();
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
    setSelectedStateId('');
    setSelectedCityId('');
    setSelectedAreaId('');
  };

  const handleVendorSignup = async (data: VendorSignupFormData) => {
    // Double-check for duplicate email/phone before submitting
    if (vendorDuplicateCheck.result?.emailExists || vendorDuplicateCheck.result?.phoneExists) {
      toast({
        title: "Validation Error",
        description: "Email or phone number already registered. Please use different credentials.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Combine country code with phone number
    const fullPhone = `${data.country_code} ${data.phone}`;
    const { error } = await signUp(data.email, data.password, 'vendor', {
      businessName: data.businessName,
      category: data.category,
      contactPerson: data.contactPerson,
      phone: fullPhone,
      businessEmail: data.businessEmail || "",
      address: data.address,
    });
    setIsLoading(false);

    if (error) {
      // Show error toast on failure
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Show success toast on successful signup
      toast({
        title: "Account Created Successfully!",
        description: "Your vendor account has been created. You can now sign in.",
      });
      // Switch to sign-in view after successful signup
      setIsSignUp(false);
    }
    
    // Clear all form fields after signup attempt (success or failure)
    vendorSignupForm.reset();
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
          {!isSignUp ? (
            <>
              <CardHeader className="pt-4">
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCustomerSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Username / Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => { setForgotEmail(email); setShowForgotDialog(true); }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Role</Label>
                    <RadioGroup 
                      value={selectedRole} 
                      onValueChange={(value) => setSelectedRole(value as 'customer' | 'vendor')}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="customer" id="role-customer" />
                        <Label htmlFor="role-customer" className="flex items-center gap-2 cursor-pointer">
                          <Users className="h-4 w-4" />
                          Customer
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vendor" id="role-vendor" />
                        <Label htmlFor="role-vendor" className="flex items-center gap-2 cursor-pointer">
                          <Store className="h-4 w-4" />
                          Vendor
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  New User?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sign Up</CardTitle>
                    <CardDescription>
                      Create a new account as {selectedRole}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsSignUp(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <Label>Select Role</Label>
                  <RadioGroup 
                    value={selectedRole} 
                    onValueChange={(value) => setSelectedRole(value as 'customer' | 'vendor')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="signup-role-customer" />
                      <Label htmlFor="signup-role-customer" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        Customer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vendor" id="signup-role-vendor" />
                      <Label htmlFor="signup-role-vendor" className="flex items-center gap-2 cursor-pointer">
                        <Store className="h-4 w-4" />
                        Vendor
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {selectedRole === 'customer' ? (
                  <>
                    <form onSubmit={customerSignupForm.handleSubmit(handleCustomerSignup)}>
                      <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4">
                          <ValidatedInput
                            id="customer-email"
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            required
                            error={customerSignupForm.formState.errors.email?.message}
                            isValidating={customerDuplicateCheck.isChecking}
                            {...customerSignupForm.register("email")}
                          />
                          
                          <ValidatedInput
                            id="customer-password"
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            required
                            error={customerSignupForm.formState.errors.password?.message}
                            {...customerSignupForm.register("password")}
                          />

                          {/* Password strength indicator */}
                          {customerPassword && (
                            <PasswordStrengthIndicator 
                              password={customerPassword}
                              userInputs={[customerEmail, customerSignupForm.watch("name")]}
                              showFeedback={true}
                            />
                          )}

                          <ValidatedInput
                            id="customer-confirm-password"
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            required
                            error={customerSignupForm.formState.errors.confirmPassword?.message}
                            {...customerSignupForm.register("confirmPassword")}
                          />
                          <ValidatedInput
                            id="customer-name"
                            label="Full Name"
                            placeholder="Your full name"
                            required
                            error={customerSignupForm.formState.errors.name?.message}
                            {...customerSignupForm.register("name")}
                          />

                          <div className="space-y-2">
                            <Label htmlFor="customer-country-code">
                              Country Code <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={customerSignupForm.watch("country_code")}
                              onValueChange={(value) => customerSignupForm.setValue("country_code", value)}
                            >
                              <SelectTrigger id="customer-country-code">
                                <SelectValue placeholder="Select country code" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="+91">+91 (India)</SelectItem>
                                <SelectItem value="+1">+1 (USA/Canada)</SelectItem>
                                <SelectItem value="+44">+44 (UK)</SelectItem>
                                <SelectItem value="+971">+971 (UAE)</SelectItem>
                                <SelectItem value="+65">+65 (Singapore)</SelectItem>
                                <SelectItem value="+61">+61 (Australia)</SelectItem>
                              </SelectContent>
                            </Select>
                            {customerSignupForm.formState.errors.country_code && (
                              <p className="text-sm text-destructive">
                                {customerSignupForm.formState.errors.country_code.message}
                              </p>
                            )}
                          </div>

                          <ValidatedInput
                            id="customer-phone"
                            label="Phone Number"
                            type="tel"
                            placeholder="9876543210"
                            required
                            error={customerSignupForm.formState.errors.phone?.message}
                            isValidating={customerDuplicateCheck.isChecking}
                            hint="Enter 10-digit mobile number"
                            {...customerSignupForm.register("phone")}
                          />
                          <div className="space-y-2">
                            <Label htmlFor="customer-state">
                              State <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={customerSignupForm.watch("state_id")}
                              onValueChange={(value) => {
                                customerSignupForm.setValue("state_id", value);
                                customerSignupForm.setValue("city_id", "");
                                customerSignupForm.setValue("area_id", "");
                                customerSignupForm.setValue("society_id", "");
                                setSelectedStateId(value);
                              }}
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
                            {customerSignupForm.formState.errors.state_id && (
                              <p className="text-sm font-medium text-destructive">
                                {customerSignupForm.formState.errors.state_id.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="customer-city">
                              City <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={customerSignupForm.watch("city_id")}
                              onValueChange={(value) => {
                                customerSignupForm.setValue("city_id", value);
                                customerSignupForm.setValue("area_id", "");
                                customerSignupForm.setValue("society_id", "");
                                setSelectedCityId(value);
                              }}
                              disabled={!selectedStateId}
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
                            {customerSignupForm.formState.errors.city_id && (
                              <p className="text-sm font-medium text-destructive">
                                {customerSignupForm.formState.errors.city_id.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="customer-area">
                              Area <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={customerSignupForm.watch("area_id")}
                              onValueChange={(value) => {
                                customerSignupForm.setValue("area_id", value);
                                customerSignupForm.setValue("society_id", "");
                                setSelectedAreaId(value);
                              }}
                              disabled={!selectedCityId}
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
                            {customerSignupForm.formState.errors.area_id && (
                              <p className="text-sm font-medium text-destructive">
                                {customerSignupForm.formState.errors.area_id.message}
                              </p>
                            )}

                            {/* Area Availability Indicator for Customer Signup */}
                            {customerSignupForm.watch("area_id") && (
                              <div className="mt-2 rounded-md border p-3 bg-muted/50">
                                {customerAreaAvailability.isChecking ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Checking service availability...</span>
                                  </div>
                                ) : customerAreaAvailability.result ? (
                                  <div className="space-y-1">
                                    <div className={`flex items-start gap-2 text-sm ${
                                      customerAreaAvailability.result.hasVendors 
                                        ? "text-green-700 dark:text-green-400" 
                                        : "text-orange-700 dark:text-orange-400"
                                    }`}>
                                      {customerAreaAvailability.result.hasVendors ? (
                                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      )}
                                      <span className="font-medium">
                                        {customerAreaAvailability.result.message}
                                      </span>
                                    </div>
                                    {customerAreaAvailability.result.hasVendors && customerAreaAvailability.result.categories && (
                                      <p className="text-xs text-muted-foreground ml-6">
                                        {customerAreaAvailability.result.categoryCount} categories including:{" "}
                                        {customerAreaAvailability.result.categories.slice(0, 3).join(", ")}
                                        {(customerAreaAvailability.result.categories.length || 0) > 3 && ", and more"}
                                      </p>
                                    )}
                                  </div>
                                ) : customerAreaAvailability.error ? (
                                  <p className="text-sm text-destructive">{customerAreaAvailability.error}</p>
                                ) : null}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="customer-society">
                              Society Name <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={customerSignupForm.watch("society_id")}
                              onValueChange={(value) => customerSignupForm.setValue("society_id", value)}
                              disabled={!selectedAreaId}
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
                            {customerSignupForm.formState.errors.society_id && (
                              <p className="text-sm font-medium text-destructive">
                                {customerSignupForm.formState.errors.society_id.message}
                              </p>
                            )}
                          </div>

                          <ValidatedInput
                            id="customer-wing"
                            label="Wing Number"
                            placeholder="Wing number (optional)"
                            error={customerSignupForm.formState.errors.wing_number?.message}
                            {...customerSignupForm.register("wing_number")}
                          />

                          <ValidatedInput
                            id="customer-flat"
                            label="Flat / Plot / House Number"
                            placeholder="Flat / Plot / House number"
                            required
                            error={customerSignupForm.formState.errors.flat_plot_house_number?.message}
                            {...customerSignupForm.register("flat_plot_house_number")}
                          />
                        </div>
                      </ScrollArea>
                      <div className="pt-4 border-t mt-4">
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={
                            isLoading || 
                            customerDuplicateCheck.isChecking || 
                            !customerSignupForm.formState.isValid ||
                            !!customerDuplicateCheck.result?.emailExists ||
                            !!customerDuplicateCheck.result?.phoneExists
                          }
                        >
                          {isLoading ? "Creating account..." : "Create Customer Account"}
                        </Button>
                      </div>
                    </form>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign In
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <form onSubmit={vendorSignupForm.handleSubmit(handleVendorSignup)}>
                      <ScrollArea className="h-[50vh] pr-4">
                        <div className="space-y-4">
                          <ValidatedInput
                            id="vendor-email"
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            required
                            error={vendorSignupForm.formState.errors.email?.message}
                            isValidating={vendorDuplicateCheck.isChecking}
                            {...vendorSignupForm.register("email")}
                          />

                          <ValidatedInput
                            id="vendor-password"
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            required
                            error={vendorSignupForm.formState.errors.password?.message}
                            {...vendorSignupForm.register("password")}
                          />

                          {/* Password strength indicator */}
                          {vendorPassword && (
                            <PasswordStrengthIndicator 
                              password={vendorPassword}
                              userInputs={[vendorEmail, vendorSignupForm.watch("businessName")]}
                              showFeedback={true}
                            />
                          )}

                          <ValidatedInput
                            id="vendor-confirm-password"
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            required
                            error={vendorSignupForm.formState.errors.confirmPassword?.message}
                            {...vendorSignupForm.register("confirmPassword")}
                          />
                          <ValidatedInput
                            id="vendor-business-name"
                            label="Business Name"
                            placeholder="Your business name"
                            required
                            error={vendorSignupForm.formState.errors.businessName?.message}
                            {...vendorSignupForm.register("businessName")}
                          />

                          <div className="space-y-2">
                            <Label htmlFor="vendor-category">
                              Business Category <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={vendorSignupForm.watch("category")}
                              onValueChange={(value) => vendorSignupForm.setValue("category", value)}
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
                            {vendorSignupForm.formState.errors.category && (
                              <p className="text-sm font-medium text-destructive">
                                {vendorSignupForm.formState.errors.category.message}
                              </p>
                            )}
                          </div>

                          <ValidatedInput
                            id="vendor-contact-person"
                            label="Contact Person Name"
                            placeholder="Primary contact person"
                            required
                            error={vendorSignupForm.formState.errors.contactPerson?.message}
                            {...vendorSignupForm.register("contactPerson")}
                          />

                          <div className="space-y-2">
                            <Label htmlFor="vendor-country-code">
                              Country Code <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={vendorSignupForm.watch("country_code")}
                              onValueChange={(value) => vendorSignupForm.setValue("country_code", value)}
                            >
                              <SelectTrigger id="vendor-country-code">
                                <SelectValue placeholder="Select country code" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="+91">+91 (India)</SelectItem>
                                <SelectItem value="+1">+1 (USA/Canada)</SelectItem>
                                <SelectItem value="+44">+44 (UK)</SelectItem>
                                <SelectItem value="+971">+971 (UAE)</SelectItem>
                                <SelectItem value="+65">+65 (Singapore)</SelectItem>
                                <SelectItem value="+61">+61 (Australia)</SelectItem>
                              </SelectContent>
                            </Select>
                            {vendorSignupForm.formState.errors.country_code && (
                              <p className="text-sm text-destructive">
                                {vendorSignupForm.formState.errors.country_code.message}
                              </p>
                            )}
                          </div>

                          <ValidatedInput
                            id="vendor-phone"
                            label="Phone Number"
                            type="tel"
                            placeholder="9876543210"
                            required
                            error={vendorSignupForm.formState.errors.phone?.message}
                            isValidating={vendorDuplicateCheck.isChecking}
                            hint="Enter 10-digit mobile number"
                            {...vendorSignupForm.register("phone")}
                          />

                          <ValidatedInput
                            id="vendor-business-email"
                            label="Business Email"
                            type="email"
                            placeholder="Business email address (optional)"
                            error={vendorSignupForm.formState.errors.businessEmail?.message}
                            hint="Must be different from login email if provided"
                            {...vendorSignupForm.register("businessEmail")}
                          />

                          <div className="space-y-2">
                            <Label htmlFor="vendor-address">
                              Business Address <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              id="vendor-address"
                              placeholder="Complete business address"
                              rows={3}
                              className={vendorSignupForm.formState.errors.address && "border-destructive"}
                              {...vendorSignupForm.register("address")}
                            />
                            {vendorSignupForm.formState.errors.address && (
                              <p className="text-sm font-medium text-destructive">
                                {vendorSignupForm.formState.errors.address.message}
                              </p>
                            )}
                          </div>

                          {/* Service Area Information for Vendors */}
                          <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
                            <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400">
                              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div className="space-y-1">
                                <p className="font-medium">Service Area Coverage</p>
                                <p className="text-xs text-blue-600 dark:text-blue-500">
                                  As a vendor, you can serve customers across all areas. The system-wide availability check ensures customers know vendors like you are ready to serve them.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="pt-4 border-t mt-4">
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={
                            isLoading || 
                            vendorDuplicateCheck.isChecking || 
                            !vendorSignupForm.formState.isValid ||
                            !!vendorDuplicateCheck.result?.emailExists ||
                            !!vendorDuplicateCheck.result?.phoneExists
                          }
                        >
                          {isLoading ? "Creating account..." : "Create Vendor Account"}
                        </Button>
                      </div>
                    </form>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign In
                      </button>
                    </p>
                  </>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
      {/* Forgot Password Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForgotDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={forgotLoading}>{forgotLoading ? "Sending..." : "Send reset email"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
