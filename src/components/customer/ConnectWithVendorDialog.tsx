import { useState } from "react";
import { QrCode, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ConnectionMethod } from "@/hooks/useVendorInviteCodes";

/**
 * ConnectWithVendorDialog Component
 * 
 * Allows customers to connect with a vendor using an invite code.
 * Supports multiple input methods for user convenience:
 * - Manual code entry (typing VEN-ABC12345)
 * - QR code scanning (camera access required) - Coming soon
 * - Auto-fill from shareable link (via URL parameter)
 * 
 * UX Flow:
 * 1. Customer opens dialog (or arrives via link)
 * 2. Enters/scans code
 * 3. System validates code and shows vendor details
 * 4. Customer confirms connection
 * 5. Connection created, customer can now order
 * 
 * Security:
 * - Validates code exists and is active
 * - Checks vendor is active
 * - Prevents duplicate connections
 * - Tracks connection method for analytics
 * 
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param customerId - The customer attempting to connect
 * @param onSuccess - Callback when connection is successful
 * @param initialCode - Pre-filled code (from URL parameter)
 */
interface ConnectWithVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess?: () => void;
  initialCode?: string;
}

export function ConnectWithVendorDialog({
  open,
  onOpenChange,
  customerId,
  onSuccess,
  initialCode = "",
}: ConnectWithVendorDialogProps) {
  const { toast } = useToast();
  
  // Form state
  const [code, setCode] = useState(initialCode);
  const [isValidating, setIsValidating] = useState(false);
  
  // Vendor preview state (after code validation)
  const [vendorPreview, setVendorPreview] = useState<{
    id: string;
    name: string;
    category: string;
    phone: string;
  } | null>(null);

  /**
   * Format code as user types (auto-add VEN- prefix if missing)
   */
  const handleCodeChange = (value: string) => {
    // Convert to uppercase
    let formatted = value.toUpperCase();
    
    // Remove any non-alphanumeric characters except hyphen
    formatted = formatted.replace(/[^A-Z0-9-]/g, '');
    
    // Auto-add VEN- prefix if user starts typing without it
    if (formatted.length > 0 && !formatted.startsWith('VEN-')) {
      formatted = 'VEN-' + formatted;
    }
    
    setCode(formatted);
  };

  /**
   * Validate the invite code and show vendor preview
   */
  const handleValidateCode = async () => {
    if (!code || code.length < 12) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid invite code (e.g., VEN-ABC12345)",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setVendorPreview(null);

    try {
      // Call the database function to validate code and get vendor details
      const { data, error } = await supabase.rpc("validate_and_use_invite_code" as any, {
        p_code: code,
        p_customer_id: customerId,
        p_connection_method: "invite_code" as ConnectionMethod,
      });

      if (error) throw error;

      const result = data as any;

      if (!result.success) {
        toast({
          title: "Invalid code",
          description: result.error || "This invite code is not valid",
          variant: "destructive",
        });
        return;
      }

      // Show vendor preview
      setVendorPreview(result.vendor);

      // Show success message
      toast({
        title: "Connected!",
        description: `You are now connected with ${result.vendor.name}`,
      });

      // Close dialog and trigger success callback
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        
        // Reset state for next use
        setCode("");
        setVendorPreview(null);
      }, 1500);

    } catch (error: any) {
      console.error("Code validation error:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle Enter key press to submit
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating && !vendorPreview) {
      handleValidateCode();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect with Vendor</DialogTitle>
          <DialogDescription>
            Enter the invite code you received from the vendor to connect and start ordering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!vendorPreview ? (
            <>
              {/* Code Input */}
              <div>
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="VEN-ABC12345"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isValidating}
                  className="font-mono text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ask the vendor for their invite code or scan their QR code
                </p>
              </div>

              {/* QR Scanner Button (Future Enhancement) */}
              <Button
                variant="outline"
                className="w-full"
                disabled
                title="QR scanner coming soon"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code (Coming Soon)
              </Button>

              {/* Submit Button */}
              <Button
                onClick={handleValidateCode}
                disabled={isValidating || code.length < 12}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </>
          ) : (
            /* Success State - Show Vendor Preview */
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1">Connected!</h3>
                <p className="text-sm text-muted-foreground">
                  You are now connected with
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="font-bold text-lg">{vendorPreview.name}</p>
                <p className="text-sm text-muted-foreground">{vendorPreview.category}</p>
                <p className="text-sm">{vendorPreview.phone}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                You can now browse their products and place orders
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
