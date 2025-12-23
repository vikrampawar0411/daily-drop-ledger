
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, ShoppingCart, LogOut, Repeat, User, UserCircle, Bell } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CustomerDashboard from "./CustomerDashboard";
import VendorDirectory from "./VendorDirectory";
import OrderCalendar from "./OrderCalendar";
import SubscriptionManagement from "./SubscriptionManagement";
import AccountSettings from "./AccountSettings";
import { WelcomeTourButton } from "@/components/onboarding/WelcomeTourButton";
import { WelcomeDialog } from "@/components/onboarding/WelcomeDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus, Minus, Package } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  price: number;
  unit: string;
  quantity: number;
  image_url?: string;
}

const CustomerApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [navigationParams, setNavigationParams] = useState<any>({});
  const { signOut, user } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('customerCartItems');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const { subscriptions, loading: subsLoading } = useSubscriptions();

  useEffect(() => {
    const loadCustomerNameAndFilterCart = async () => {
      if (!user) return;
      // 1. Load customer name
      const { data } = await supabase
        .from('customers')
        .select('name, id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCustomerName(data.name);
        // 2. Fetch delivered quick orders for this customer
        const { data: deliveredOrders, error } = await supabase
          .from('orders')
          .select('id, vendor_id, product_id, status')
          .eq('customer_id', data.id)
          .eq('status', 'delivered');
        if (!error && deliveredOrders) {
          // 3. Remove delivered quick orders from cart
          setCartItems(prev => {
            const deliveredIds = new Set(
              deliveredOrders.map(o => `${o.vendor_id}-${o.product_id}`)
            );
            const filtered = prev.filter(item => !deliveredIds.has(item.id));
            localStorage.setItem('customerCartItems', JSON.stringify(filtered));
            return filtered;
          });
        }
      }
    };
    loadCustomerNameAndFilterCart();
  }, [user]);

  const addToCart = (product: any, vendor: any, quantity: number = 1) => {
    const cartItemId = `${vendor.id}-${product.id}`;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      const updated = existing
        ? prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item)
        : [...prev, {
            id: cartItemId,
            productId: product.id,
            productName: product.name,
            vendorId: vendor.id,
            vendorName: vendor.name,
            price: product.price,
            unit: product.unit,
            quantity,
            image_url: product.image_url
          }];
      localStorage.setItem('customerCartItems', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== cartItemId);
      localStorage.setItem('customerCartItems', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCartItemQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems(prev => {
        const updated = prev.map(item =>
          item.id === cartItemId ? { ...item, quantity } : item
        );
        localStorage.setItem('customerCartItems', JSON.stringify(updated));
        return updated;
      });
    }
    // On login, filter out delivered items from cart
    useEffect(() => {
      // You may want to fetch delivered order IDs from backend and filter them out here
      // For now, this is a placeholder for future logic
      // Example:
      // setCartItems(prev => prev.filter(item => !deliveredOrderIds.includes(item.id)));
    }, [user]);
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const handleNavigation = (tab: string, params?: any) => {
    setActiveTab(tab);
    setNavigationParams(params || {});
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between min-h-16 py-2 gap-2">

            <div className="flex items-center space-x-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-10 w-10 rounded-full flex items-center justify-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        {customerName ? customerName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveTab('account')}>
                    <User className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage your orders and vendors</p>
              </div>
              <WelcomeTourButton onClick={() => setWelcomeDialogOpen(true)} />
            </div>

            {/* Notification and Cart Buttons - right aligned, borderless until hover */}
            <div className="flex-1 flex justify-end items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartDialogOpen(true)}
                className="relative border border-transparent hover:border-gray-300 focus:border-gray-400 rounded-full"
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItems.length > 0 && (
                  <Badge className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CustomerDashboard 
              onNavigate={handleNavigation} 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              navigationParams={navigationParams}
            />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionManagement onNavigate={handleNavigation} navigationParams={navigationParams} addToCart={addToCart} />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorDirectory onNavigate={handleNavigation} />
          </TabsContent>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Dialog */}
      <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
            </DialogTitle>
          </DialogHeader>

          {cartItems.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add items using the Quick Order button</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex gap-3">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.productName}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground">{item.vendorName}</p>
                        <p className="text-sm font-medium mt-1">₹{item.price}/{item.unit}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 border rounded p-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Items:</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Subscribed Products (minimal info) */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Active Subscriptions</span>
              {subsLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
            </div>
            <div className="grid gap-2">
              {subscriptions && subscriptions.filter(sub => sub.status !== 'cancelled').length > 0 ? (
                subscriptions
                  .filter(sub => sub.status !== 'cancelled')
                  .slice(0, 6)
                  .map((sub) => (
                    <div key={sub.id} className="rounded-md border p-2 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{sub.product?.name || 'Product'}</div>
                        <div className="text-xs text-muted-foreground truncate">{sub.vendor?.name || 'Vendor'} · {sub.frequency}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qty {sub.quantity} {sub.unit}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-sm text-muted-foreground">No active subscriptions</div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCartDialogOpen(false)}
              className="flex-1"
            >
              Continue Shopping
            </Button>
            {cartItems.length > 0 && (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  console.log('Checkout clicked with items:', cartItems);
                }}
              >
                Checkout
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Welcome Tour Dialog */}
      <WelcomeDialog 
        userType="customer" 
        userName={customerName}
        isOpen={welcomeDialogOpen}
        onClose={() => setWelcomeDialogOpen(false)}
      />
    </div>
  );
};

export default CustomerApp;
