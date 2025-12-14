import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Plus, Trash2, Power, PowerOff, Share2, MessageCircle, MessageSquare, Mail, Facebook, Twitter, Linkedin, Phone, QrCode, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVendorInviteCodes, type VendorInviteCode } from "@/hooks/useVendorInviteCodes";
import { useToast } from "@/hooks/use-toast";
import { generateShareableLink } from "@/lib/urlUtils";

/**
 * InviteCodeManager Component
 * 
 * Provides a comprehensive UI for vendors to manage their invite codes.
 * Vendors can create, view, share, and manage codes with different settings.
 * 
 * Features:
 * - Generate new invite codes with custom labels and settings
 * - Display QR codes for easy sharing
 * - Copy codes and shareable links to clipboard
 * - View usage statistics (how many times used)
 * - Toggle codes active/inactive
 * - Set expiry dates and usage limits
 * - Delete codes (preserves existing connections)
 * 
 * UX Considerations:
 * - QR codes are prominently displayed for in-person sharing
 * - Copy-to-clipboard for digital sharing (WhatsApp, SMS, etc.)
 * - Usage tracking helps vendors see which codes are most effective
 * - Visual indicators for expired/maxed-out codes
 * 
 * @param vendorId - The ID of the vendor managing codes
 */
interface InviteCodeManagerProps {
  vendorId: string;
  externalTrigger?: boolean;
  onInviteTriggered?: () => void;
}

export function InviteCodeManager({ vendorId, externalTrigger, onInviteTriggered }: InviteCodeManagerProps) {
  const { codes, isLoading, createCode, updateCode, deleteCode, isMutating } = useVendorInviteCodes(vendorId);
  const { toast } = useToast();
  
  // State for create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCodeLabel, setNewCodeLabel] = useState("");
  const [newCodeExpiryDays, setNewCodeExpiryDays] = useState<number | "">("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number | "">("");
  
    // State for phone number input per code
    const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({});

  /**
   * Generate the shareable link for a code
   * Customers can click this link to auto-fill the code
   * 
   * For mobile devices scanning QR codes on the same network:
   * - Uses the actual network IP (e.g., 192.168.0.158:8080)
   * - NOT localhost (which doesn't work on mobile)
   * 
   * The Vite dev server displays the Network URL in terminal:
   * ➜  Network: http://192.168.0.158:8080/
   * 
   * To enable mobile testing: Set VITE_NETWORK_URL environment variable
   */
  const getShareableLink = (code: string) => {
    return generateShareableLink(code);
  };

  /**
   * Copy text to clipboard with user feedback
   */
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle sharing via various platforms
   * 
   * SOLUTION: Use platform-specific URL schemes that open the apps directly
   * For WhatsApp/SMS, we need to be smart about encoding to keep links clickable
   * SMS now supports sending to specific phone numbers
   */
  const handleShare = (platform: string, code: VendorInviteCode) => {
    const link = getShareableLink(code.code);
    const phoneNumber = phoneNumbers[code.id] || "";
    
    let shareUrl = "";
    
    switch (platform) {
      case "whatsapp":
        // WhatsApp Web/App - Opens WhatsApp with pre-filled message
        // Use api.whatsapp.com which works better than wa.me for sharing links
        const whatsappMessage = encodeURIComponent(link);
        shareUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;
        break;
      
      case "sms":
        // Server-side SMS sending via API - no fallback to SMS app
        (async () => {
          const rawNumber = (phoneNumber || "").trim();
          const sanitizedNumber = rawNumber.replace(/[^+\d]/g, "");
          
          if (!sanitizedNumber) {
            toast({ 
              title: "Mobile number required", 
              description: "Please enter a valid phone number to send the invite.", 
              variant: "destructive" 
            });
            return;
          }
          
          const smsApi = import.meta.env.VITE_SMS_API_URL;
          const smsToken = import.meta.env.VITE_SMS_API_TOKEN;
          
          if (!smsApi) {
            toast({ 
              title: "SMS service unavailable", 
              description: "SMS API is not configured. Please contact administrator.", 
              variant: "destructive" 
            });
            return;
          }
          
          // Show loading state
          toast({ 
            title: "Sending invite...", 
            description: `Sending to ${sanitizedNumber}` 
          });
          
          try {
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (smsToken) {
              headers["X-API-Key"] = smsToken;
            }
            
            const res = await fetch(smsApi, {
              method: "POST",
              headers,
              body: JSON.stringify({ to: sanitizedNumber, body: link })
            });
            
            if (!res.ok) {
              const errData = await res.json().catch(() => ({ error: "Unknown error" }));
              throw new Error(errData.error || `SMS API error: ${res.status}`);
            }
            
            const result = await res.json();
            toast({ 
              title: "✅ Invite sent successfully", 
              description: `Link delivered to ${sanitizedNumber}`,
              duration: 5000
            });
            
            // Clear the phone number after successful send
            setPhoneNumbers(prev => ({ ...prev, [code.id]: "" }));
            
          } catch (err) {
            console.error("SMS send error:", err);
            toast({ 
              title: "Failed to send SMS", 
              description: err instanceof Error ? err.message : "Network error. Please try again.", 
              variant: "destructive",
              duration: 7000
            });
          }
        })();
        return; // Avoid default shareUrl flow
      
      case "email":
        // Email - standard mailto format
        const emailSubject = encodeURIComponent("Connect with me - Vendor Invite");
        const emailBody = encodeURIComponent(
          `Connect with me as a customer!\n\n` +
          `${link}\n\n` +
          `Invite code: ${code.code}\n\n` +
          `Looking forward to serving you!`
        );
        shareUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
        break;
      
      case "facebook":
        // Facebook share - opens Facebook with the link
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      
      case "twitter":
        // Twitter/X share - opens Twitter with pre-filled tweet
        const tweetText = encodeURIComponent(`Connect with me! Invite code: ${code.code}`);
        shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(link)}`;
        break;
      
      case "linkedin":
        // LinkedIn share - opens LinkedIn share dialog
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
      
      case "native":
        // Use Web Share API if available (mobile browsers)
        if (navigator.share) {
          navigator.share({
            title: "Vendor Invite - Connect with Me",
            text: `🎉 Connect with me!\n\nInvite code: ${code.code}`,
            url: link,
          }).catch((error) => {
            console.error("Error sharing:", error);
          });
          return;
        } else {
          // Fallback: copy to clipboard with simple format
          const fallbackMessage = `${link}\n\n🎉 Connect with me as a customer!\n\nInvite code: ${code.code}`;
          copyToClipboard(fallbackMessage, "Share message");
          return;
        }
    }
    
    // Open share URL in new window/tab
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Opening share dialog",
        description: `Sharing via ${platform}`,
      });
    }
  };

  /**
   * Handle creating a new invite code
   */
  const handleCreateCode = async () => {
    try {
      // Calculate expiry date if days specified
      let expiresAt: string | undefined;
      if (newCodeExpiryDays && newCodeExpiryDays > 0) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + Number(newCodeExpiryDays));
        expiresAt = expiry.toISOString();
      }

      await createCode({
        label: newCodeLabel || undefined,
        expires_at: expiresAt,
        max_uses: newCodeMaxUses ? Number(newCodeMaxUses) : undefined,
      });

      // Reset form and close dialog
      setNewCodeLabel("");
      setNewCodeExpiryDays("");
      setNewCodeMaxUses("");
      setCreateDialogOpen(false);
    } catch (error) {
      // Error already handled by the hook
      console.error("Failed to create code:", error);
    }
  };

  /**
   * Toggle code active/inactive status
   */
  const handleToggleActive = async (code: VendorInviteCode) => {
    try {
      await updateCode({
        id: code.id,
        is_active: !code.is_active,
      });
    } catch (error) {
      // Error already handled by the hook
      console.error("Failed to toggle code:", error);
    }
  };

  /**
   * Delete a code with confirmation
   */
  const handleDeleteCode = async (code: VendorInviteCode) => {
    if (!confirm(`Are you sure you want to delete code ${code.code}? Existing connections will not be affected.`)) {
      return;
    }

    try {
      await deleteCode(code.id);
    } catch (error) {
      // Error already handled by the hook
      console.error("Failed to delete code:", error);
    }
  };

  /**
   * Check if a code is expired
   */
  const isExpired = (code: VendorInviteCode) => {
    return code.expires_at && new Date(code.expires_at) < new Date();
  };

  /**
   * Check if a code has reached max uses
   */
  const isMaxedOut = (code: VendorInviteCode) => {
    return code.max_uses !== null && code.used_count >= code.max_uses;
  };

  /**
   * Get status badge for a code
   */
  const getStatusBadge = (code: VendorInviteCode) => {
    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (isExpired(code)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isMaxedOut(code)) {
      return <Badge variant="destructive">Max Uses Reached</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

    // Handle external trigger - scroll to first active code
  useEffect(() => {
    if (externalTrigger && codes.length > 0) {
        // Scroll to invite codes section
        const element = document.getElementById('invite-codes');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      onInviteTriggered?.();
    }
  }, [externalTrigger, codes, onInviteTriggered]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite Codes</CardTitle>
          <CardDescription>Loading your invite codes...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invite Codes</h2>
          <p className="text-sm text-muted-foreground">
            Share codes with customers to connect and receive orders
          </p>
        </div>

        {/* Create New Code Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invite Code</DialogTitle>
              <DialogDescription>
                Generate a unique code to share with customers. They can use this code to connect with you.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Label (Optional) */}
              <div>
                <Label htmlFor="label">Label (Optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., New Year Promo, Society ABC"
                  value={newCodeLabel}
                  onChange={(e) => setNewCodeLabel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give this code a name to remember its purpose
                </p>
              </div>

              {/* Expiry (Optional) */}
              <div>
                <Label htmlFor="expiry">Expires In (Days, Optional)</Label>
                <Input
                  id="expiry"
                  type="number"
                  min="1"
                  placeholder="Leave empty for no expiry"
                  value={newCodeExpiryDays}
                  onChange={(e) => setNewCodeExpiryDays(e.target.value ? Number(e.target.value) : "")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set how long this code remains valid
                </p>
              </div>

              {/* Max Uses (Optional) */}
              <div>
                <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={newCodeMaxUses}
                  onChange={(e) => setNewCodeMaxUses(e.target.value ? Number(e.target.value) : "")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Limit how many customers can use this code
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCode} disabled={isMutating}>
                {isMutating ? "Creating..." : "Create Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {codes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invite Codes Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first invite code to start connecting with customers
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Codes List */}
      {codes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {codes.map((code) => (
            <Card key={code.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                    {code.label && (
                      <CardDescription className="mt-1">{code.label}</CardDescription>
                    )}
                  </div>
                  {getStatusBadge(code)}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* QR Code Display - directly in card */}
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <QRCodeSVG
                    value={getShareableLink(code.code)}
                    size={160}
                    level="H"
                    includeMargin
                  />
                </div>

                {/* Shareable Link - directly in card */}
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <span className="text-xs truncate flex-1 font-mono">
                    {getShareableLink(code.code)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getShareableLink(code.code), "Link")}
                    className="shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                {/* Usage Stats */}
                <div className="text-sm pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="font-medium">
                      {code.used_count}
                      {code.max_uses && ` / ${code.max_uses}`}
                    </span>
                  </div>
                  {code.expires_at && (
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">
                        {new Date(code.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                  {/* Phone Number Input */}
                  <div className="space-y-2">
                    <Label htmlFor={`phone-${code.id}`} className="text-xs font-medium">Mobile Number (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`phone-${code.id}`}
                        placeholder="+91 9876543210"
                        value={phoneNumbers[code.id] || ""}
                        onChange={(e) => setPhoneNumbers(prev => ({ ...prev, [code.id]: e.target.value }))}
                        type="tel"
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare("sms", code)}
                        disabled={!phoneNumbers[code.id]}
                        className="h-8 px-2"
                        title="Share via SMS"
                      >
                        <Send className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline Share Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("sms", code)}
                      className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                      title="Send via SMS"
                    >
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-[10px]">SMS</span>
                    </Button>
                  
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("whatsapp", code)}
                      className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                      title="Share on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-[10px]">WhatsApp</span>
                    </Button>
                  
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("email", code)}
                      className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                      title="Send via Email"
                    >
                      <Mail className="h-4 w-4 text-red-600" />
                      <span className="text-[10px]">Email</span>
                    </Button>
                  
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getShareableLink(code.code), "Link")}
                      className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                      title="Copy Link"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                      <span className="text-[10px]">Copy</span>
                    </Button>
                </div>

                {/* Management Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  {/* Toggle Active */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(code)}
                    disabled={isMutating}
                    className="flex-1"
                  >
                    {code.is_active ? (
                      <>
                        <PowerOff className="h-3 w-3 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-3 w-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCode(code)}
                    disabled={isMutating}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
