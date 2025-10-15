import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Check, X } from "lucide-react";
import { useProductRequests } from "@/hooks/useProductRequests";

const ProductRequestsManagement = () => {
  const { productRequests, loading, approveProductRequest, rejectProductRequest } = useProductRequests();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  const handleApprove = async () => {
    if (selectedRequestId) {
      try {
        await approveProductRequest(selectedRequestId, adminNotes);
        setShowApproveDialog(false);
        setSelectedRequestId("");
        setAdminNotes("");
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleReject = async () => {
    if (selectedRequestId) {
      try {
        await rejectProductRequest(selectedRequestId, adminNotes);
        setShowRejectDialog(false);
        setSelectedRequestId("");
        setAdminNotes("");
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = productRequests.filter(r => r.status === 'pending');
  const reviewedRequests = productRequests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading product requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Approval Requests</h2>
        <Badge variant="secondary" className="text-base">
          {pendingRequests.length} Pending
        </Badge>
      </div>

      {/* Pending Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pending Approval</h3>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No pending requests</p>
              <p className="text-sm text-muted-foreground mt-2">All product requests have been reviewed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested by: {request.vendor?.name || "Unknown"} ({request.vendor?.email})
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>
                      <div className="text-muted-foreground">{request.category}</div>
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>
                      <div className="text-muted-foreground">₹{request.price} {request.unit}</div>
                    </div>
                    <div>
                      <span className="font-medium">Availability:</span>
                      <div className="text-muted-foreground">{request.availability}</div>
                    </div>
                    <div>
                      <span className="font-medium">Requested:</span>
                      <div className="text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {request.description && (
                    <div className="text-sm">
                      <span className="font-medium">Description:</span>
                      <div className="text-muted-foreground">{request.description}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setShowApproveDialog(true);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedRequestId(request.id);
                        setShowRejectDialog(true);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reviewed Requests</h3>
          <div className="grid grid-cols-1 gap-4">
            {reviewedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested by: {request.vendor?.name || "Unknown"}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>
                      <div className="text-muted-foreground">{request.category}</div>
                    </div>
                    <div>
                      <span className="font-medium">Price:</span>
                      <div className="text-muted-foreground">₹{request.price} {request.unit}</div>
                    </div>
                    <div>
                      <span className="font-medium">Reviewed:</span>
                      <div className="text-muted-foreground">
                        {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {request.admin_notes && (
                    <div className="text-sm">
                      <span className="font-medium">Admin Notes:</span>
                      <div className="text-muted-foreground">{request.admin_notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Product Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create the product in the master list and automatically add it to the vendor's product list.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Rejection (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductRequestsManagement;
