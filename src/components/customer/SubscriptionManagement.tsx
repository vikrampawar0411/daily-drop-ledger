import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Pause, Play, X, Calendar as CalendarIcon } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { format } from "date-fns";

const SubscriptionManagement = () => {
  const { subscriptions, loading, pauseSubscription, resumeSubscription, cancelSubscription } = useSubscriptions();
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [pauseFromDate, setPauseFromDate] = useState<Date | undefined>(new Date());
  const [pauseUntilDate, setPauseUntilDate] = useState<Date | undefined>(undefined);

  const handlePause = (subscriptionId: string) => {
    setSelectedSubscription(subscriptionId);
    setPauseDialogOpen(true);
  };

  const handlePauseConfirm = async () => {
    if (selectedSubscription && pauseFromDate && pauseUntilDate) {
      await pauseSubscription(
        selectedSubscription,
        pauseFromDate.toISOString().split('T')[0],
        pauseUntilDate.toISOString().split('T')[0]
      );
      setPauseDialogOpen(false);
      setSelectedSubscription(null);
      setPauseFromDate(new Date());
      setPauseUntilDate(undefined);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Every Day";
      case "weekly":
        return "Every Week";
      case "monthly":
        return "Every Month";
      default:
        return frequency;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        <p className="text-sm text-muted-foreground">Manage your recurring orders</p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No active subscriptions</p>
            <p className="text-sm text-muted-foreground mt-2">Create a subscription when placing an order</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{subscription.vendor?.name}</CardTitle>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Product:</span>
                  <div className="text-muted-foreground">{subscription.product?.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Quantity:</span>
                    <div className="text-muted-foreground">{subscription.quantity} {subscription.unit}</div>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <div className="text-muted-foreground">₹{subscription.price_per_unit}/{subscription.unit}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Frequency:</span>
                  <div className="text-muted-foreground">{getFrequencyLabel(subscription.frequency)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>
                    <div className="text-muted-foreground">
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  {subscription.end_date && (
                    <div>
                      <span className="font-medium">Ends:</span>
                      <div className="text-muted-foreground">
                        {new Date(subscription.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
                {subscription.status === "paused" && subscription.paused_from && subscription.paused_until && (
                  <div className="text-sm bg-yellow-50 p-2 rounded">
                    <span className="font-medium">Paused:</span>
                    <div className="text-muted-foreground">
                      {new Date(subscription.paused_from).toLocaleDateString()} - {new Date(subscription.paused_until).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  {subscription.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(subscription.id)}
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {subscription.status === "paused" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resumeSubscription(subscription.id)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {subscription.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => cancelSubscription(subscription.id)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pause From</Label>
              <Calendar
                mode="single"
                selected={pauseFromDate}
                onSelect={setPauseFromDate}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label>Resume On</Label>
              <Calendar
                mode="single"
                selected={pauseUntilDate}
                onSelect={setPauseUntilDate}
                className="rounded-md border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePauseConfirm} disabled={!pauseFromDate || !pauseUntilDate}>
              Confirm Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;
