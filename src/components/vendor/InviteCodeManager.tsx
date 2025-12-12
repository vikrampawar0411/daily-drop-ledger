import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Plus, QrCode, Trash2, Power, PowerOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVendorInviteCodes, type VendorInviteCode } from "@/hooks/useVendorInviteCodes";
import { useToast } from "@/hooks/use-toast";
import { generateShareableLink, getNetworkUrlHint } from "@/lib/urlUtils";

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
}

export function InviteCodeManager({ vendorId }: InviteCodeManagerProps) {
  const { codes, isLoading, createCode, updateCode, deleteCode, isMutating } = useVendorInviteCodes(vendorId);
  const { toast } = useToast();
  
  // State for create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCodeLabel, setNewCodeLabel] = useState("");
  const [newCodeExpiryDays, setNewCodeExpiryDays] = useState<number | "">("");
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number | "">("");
  
  // State for QR dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedCodeForQR, setSelectedCodeForQR] = useState<VendorInviteCode | null>(null);

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
                {/* Usage Stats */}
                <div className="text-sm">
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

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Copy Code */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code.code, "Code")}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>

                  {/* Show QR */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCodeForQR(code);
                      setQrDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    QR
                  </Button>

                  {/* Copy Link */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getShareableLink(code.code), "Link")}
                    className="flex-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Link
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

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for {selectedCodeForQR?.code}</DialogTitle>
            <DialogDescription>
              Customers can scan this QR code to connect with you instantly
            </DialogDescription>
          </DialogHeader>

          {selectedCodeForQR && (
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="flex justify-center p-8 bg-white rounded-lg">
                <QRCodeSVG
                  value={getShareableLink(selectedCodeForQR.code)}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>

              {/* Code and Link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-mono font-bold text-lg">{selectedCodeForQR.code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedCodeForQR.code, "Code")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-xs truncate flex-1">
                    {getShareableLink(selectedCodeForQR.code)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getShareableLink(selectedCodeForQR.code), "Link")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">Share this with customers:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Show QR code for them to scan</li>
                  <li>Share the code for manual entry</li>
                  <li>Send the link via WhatsApp/SMS</li>
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
