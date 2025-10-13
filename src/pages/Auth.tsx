import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milk, Newspaper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CustomerSignupForm, CustomerSignupData } from '@/components/auth/CustomerSignupForm';
import { VendorSignupForm, VendorSignupData } from '@/components/auth/VendorSignupForm';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'vendor' | 'customer'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<'credentials' | 'details'>('credentials');
  const { signIn, signUp, user } = useAuth();
  const { enableGuestMode } = useGuest();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    // Move to details step
    setSignupStep('details');
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
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created! Please check your email to verify your account.',
      });
      setSignupStep('credentials');
      setEmail('');
      setPassword('');
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
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created! Please check your email to verify your account.',
      });
      setSignupStep('credentials');
      setEmail('');
      setPassword('');
    }
  };

  const handleBackToCredentials = () => {
    setSignupStep('credentials');
  };

  const handleGuestAccess = () => {
    enableGuestMode();
    navigate('/');
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
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@example.com"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupStep === 'credentials' ? (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <RadioGroup value={role} onValueChange={(value) => setRole(value as 'vendor' | 'customer')}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="customer" id="customer" />
                          <Label htmlFor="customer" className="font-normal cursor-pointer">
                            Customer
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vendor" id="vendor" />
                          <Label htmlFor="vendor" className="font-normal cursor-pointer">
                            Vendor
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      Continue
                    </Button>
                  </form>
                ) : (
                  <>
                    {role === 'customer' ? (
                      <CustomerSignupForm
                        email={email}
                        password={password}
                        onSubmit={handleCustomerSignup}
                        onBack={handleBackToCredentials}
                        isLoading={isLoading}
                      />
                    ) : (
                      <VendorSignupForm
                        email={email}
                        password={password}
                        onSubmit={handleVendorSignup}
                        onBack={handleBackToCredentials}
                        isLoading={isLoading}
                      />
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={handleGuestAccess}
                className="w-full"
              >
                Continue as Guest
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Access the app without signing in
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
