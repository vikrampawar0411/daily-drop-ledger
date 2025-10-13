import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Milk, Newspaper, Shield } from "lucide-react";
import { CustomerSignupForm, CustomerSignupData } from "@/components/auth/CustomerSignupForm";
import { VendorSignupForm, VendorSignupData } from "@/components/auth/VendorSignupForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupStep, setSignupStep] = useState<'credentials' | 'customer' | 'vendor'>('credentials');
  const [signupCredentials, setSignupCredentials] = useState({ email: '', password: '' });
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Hardcoded admin credentials
    if (adminCredentials.username === 'admin@dailydropledger.com' && adminCredentials.password === 'Admin@123') {
      try {
        // Check if admin exists
        const { data: adminExists } = await supabase.rpc('admin_exists');

        if (!adminExists) {
          // First time setup: create admin account
          const { user: signUpUser, error: signUpError } = await signUp(
            'admin@dailydropledger.com',
            'Admin@123',
            'admin' as any
          );

          if (signUpError) {
            toast({
              title: "Admin Setup Failed",
              description: signUpError.message,
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          if (signUpUser) {
            // Bootstrap admin role
            await supabase.rpc('bootstrap_admin', { admin_user_id: signUpUser.id });
          }

          toast({
            title: "Admin Account Created",
            description: "Admin account is ready. Signing you in...",
          });
          
          // Sign in immediately after creation
          const { error: signInError } = await signIn('admin@dailydropledger.com', 'Admin@123');
          
          if (signInError) {
            toast({
              title: "Error",
              description: signInError.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Welcome Admin!",
              description: "You have successfully signed in.",
            });
            navigate("/");
          }
          setIsLoading(false);
          return;
        }

        // Admin exists, sign in normally
        const { error: signInError } = await signIn('admin@dailydropledger.com', 'Admin@123');
        
        if (signInError) {
          toast({
            title: "Error",
            description: signInError.message,
            variant: "destructive",
          });
        } else {
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
    } else {
      toast({
        title: "Invalid Credentials",
        description: "Incorrect username or password.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // This function is not needed as we handle role selection with buttons
  };

  const handleCustomerSignup = async (data: CustomerSignupData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, 'customer', {
      name: data.name,
      phone: data.phone,
      area_id: data.area_id,
      society_id: data.society_id,
      wing_number: data.wing_number,
      flat_plot_house_number: data.flat_plot_house_number,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created! Please check your email to verify your account.",
      });
      setSignupStep('credentials');
      setEmail('');
      setPassword('');
      setSignupCredentials({ email: '', password: '' });
    }
  };

  const handleVendorSignup = async (data: VendorSignupData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, 'vendor', {
      businessName: data.businessName,
      category: data.category,
      contactPerson: data.contactPerson,
      phone: data.phone,
      businessEmail: data.businessEmail,
      address: data.address,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created! Please check your email to verify your account.",
      });
      setSignupStep('credentials');
      setEmail('');
      setPassword('');
      setSignupCredentials({ email: '', password: '' });
    }
  };

  const handleBackToCredentials = () => {
    setSignupStep('credentials');
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
        </div>

        <Card className="max-h-[90vh] overflow-y-auto">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="admin">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
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
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              {signupStep === 'credentials' && (
                <>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Choose your role to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email *</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password *</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            if (!email || !password) {
                              toast({
                                title: "Error",
                                description: "Please enter email and password first",
                                variant: "destructive",
                              });
                              return;
                            }
                            setSignupCredentials({ email, password });
                            setSignupStep('customer');
                          }}
                        >
                          I'm a Customer
                        </Button>
                        <Button 
                          type="button"
                          onClick={() => {
                            if (!email || !password) {
                              toast({
                                title: "Error",
                                description: "Please enter email and password first",
                                variant: "destructive",
                              });
                              return;
                            }
                            setSignupCredentials({ email, password });
                            setSignupStep('vendor');
                          }}
                        >
                          I'm a Vendor
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}
              
              {signupStep === 'customer' && (
                <>
                  <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                    <CardDescription>
                      Complete your customer profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CustomerSignupForm
                      email={signupCredentials.email}
                      password={signupCredentials.password}
                      onSubmit={handleCustomerSignup}
                      onBack={handleBackToCredentials}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </>
              )}

              {signupStep === 'vendor' && (
                <>
                  <CardHeader>
                    <CardTitle>Vendor Details</CardTitle>
                    <CardDescription>
                      Complete your business profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VendorSignupForm
                      email={signupCredentials.email}
                      password={signupCredentials.password}
                      onSubmit={handleVendorSignup}
                      onBack={handleBackToCredentials}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </>
              )}
            </TabsContent>

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
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
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
