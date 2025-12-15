import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectWithVendorDialog } from "@/components/customer/ConnectWithVendorDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store, Phone, MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * ConnectWithVendor Page
 * 
 * HASSLE-FREE Connection Flow:
 * 
 * UNAUTHENTICATED users (scanning QR):
 * 1. See vendor preview with business details (NO login required)
 * 2. Click "Connect with [Vendor]" → redirected to signup/login
 * 3. After auth, automatically connected and redirected to dashboard
 * 
 * AUTHENTICATED users:
 * 1. See vendor preview
 * 2. Click "Connect" → instantly connected
 * 3. Redirected to dashboard
 * 
 * This eliminates the frustrating "login wall" and lets users see
 * what they're connecting to before creating an account.
 */

interface VendorPreview {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  email: string;
}

export default function ConnectWithVendor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get the invite code from URL parameter
  const inviteCode = searchParams.get("code") || "";

  // State for vendor preview
  const [isLoadingVendor, setIsLoadingVendor] = useState(true);
  const [vendor, setVendor] = useState<VendorPreview | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // State for customer data (only when authenticated)
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  // State for connection
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  /**
   * Effect: Validate code and fetch vendor preview (PUBLIC - no auth required)
   */
  useEffect(() => {
    const fetchVendorFromCode = async () => {
      if (!inviteCode) {
        setCodeError("No invite code provided");
        setIsLoadingVendor(false);
        return;
      }

      try {
        console.log("Validating invite code:", inviteCode);

        // Step 1: Fetch the invite code (with public policy)
        const { data: codeData, error: codeError } = await supabase
          .from("vendor_invite_codes" as any)
          .select("id, vendor_id, expires_at, max_uses, used_count, is_active")
          .eq("code", inviteCode)
          .maybeSingle();

        console.log("Code query result:", { codeData, codeError });

        if (codeError) {
          console.error("Error fetching code:", codeError);
          setCodeError("Invalid invite code");
          setIsLoadingVendor(false);
          return;
        }

        if (!codeData) {
          setCodeError("Invalid or expired invite code");
          setIsLoadingVendor(false);
          return;
        }

        const inviteData = codeData as any;
        
        // Check if code is active
        if (!inviteData.is_active) {
          setCodeError("This invite code is no longer active");
          setIsLoadingVendor(false);
          return;
        }

        // Check expiry
        if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
          setCodeError("This invite code has expired");
          setIsLoadingVendor(false);
          return;
        }

        // Check max uses
        if (inviteData.max_uses && inviteData.used_count >= inviteData.max_uses) {
          setCodeError("This invite code has reached its maximum usage limit");
          setIsLoadingVendor(false);
          return;
        }

        console.log("Code is valid, fetching vendor:", inviteData.vendor_id);

        // Step 2: Fetch vendor data (public access via "Allow public read access to vendors" policy)
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("id, name, category, phone, address, email")
          .eq("id", inviteData.vendor_id)
          .maybeSingle();

        console.log("Vendor query result:", { vendorData, vendorError });

        if (vendorError) {
          console.error("Error fetching vendor:", vendorError);
          setCodeError("Vendor not found");
          setIsLoadingVendor(false);
          return;
        }

        if (!vendorData) {
          setCodeError("Vendor not found or inactive");
          setIsLoadingVendor(false);
          return;
        }

        console.log("Vendor found:", vendorData);
        setVendor(vendorData as VendorPreview);

      } catch (error) {
        console.error("Error fetching vendor:", error);
        setCodeError("Failed to load vendor information");
      } finally {
        setIsLoadingVendor(false);
      }
    };

    fetchVendorFromCode();
  }, [inviteCode]);

  /**
   * Effect: Fetch customer data when user is authenticated
   */
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user) {
        setIsLoadingCustomer(false);
        return;
      }

      setIsLoadingCustomer(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCustomerId(data.id);
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setIsLoadingCustomer(false);
      }
    };

    fetchCustomer();
  }, [user]);

  /**
   * Handle connection for authenticated users
   */
  const handleConnect = async () => {
    if (!user || !customerId || !vendor) return;

    setIsConnecting(true);
    try {
      // Check if already connected
      const { data: existingConnection } = await supabase
        .from("vendor_customer_connections")
        .select("id")
        .eq("vendor_id", vendor.id)
        .eq("customer_id", customerId)
        .maybeSingle();

      if (existingConnection) {
        toast({
          title: "Already Connected",
          description: "You are already connected to this vendor",
        });
        navigate("/dashboard");
        return;
      }

      // Use the validate_and_use_invite_code function
      const { data, error } = await supabase.rpc("validate_and_use_invite_code" as any, {
        p_code: inviteCode,
        p_customer_id: customerId,
        p_connection_method: "qr_scan",
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (result.success) {
        setConnectionSuccess(true);
        toast({
          title: "Connected Successfully!",
          description: `You are now connected to ${vendor.name}`,
        });
        
        // Redirect after a brief delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect with vendor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Handle "Connect" button click for unauthenticated users
   */
  const handleLoginToConnect = () => {
    const returnUrl = `/connect?code=${inviteCode}`;
    navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
  };

  // Loading vendor preview
  if (isLoadingVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading Vendor Information</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (codeError || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invite Code</CardTitle>
            <CardDescription>{codeError || "Vendor not found"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (after connection)
  if (connectionSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Successfully Connected!</CardTitle>
            <CardDescription>
              You are now connected to {vendor.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vendor preview with connection button
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl py-8">
        {/* Vendor Preview Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{vendor.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {vendor.category}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-3">
              {vendor.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="flex-1">{vendor.address}</span>
                </div>
              )}
            </div>

            {/* Connection Info */}
            <div className="rounded-lg bg-muted/50 p-4 mt-6">
              <p className="text-sm text-muted-foreground">
                Connect with <span className="font-semibold text-foreground">{vendor.name}</span> to:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Place orders and manage subscriptions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Track deliveries and view order history
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Receive updates and special offers
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            {user && customerId ? (
              // Authenticated user - direct connection
              <div className="space-y-3">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || isLoadingCustomer}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect with {vendor.name}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  You'll be able to start ordering immediately
                </p>
              </div>
            ) : (
              // Unauthenticated user - signup/login required
              <div className="space-y-3">
                <Button
                  onClick={handleLoginToConnect}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  Sign Up / Login to Connect
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Create an account or login to connect with {vendor.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

