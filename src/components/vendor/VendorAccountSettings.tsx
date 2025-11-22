import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VendorAccountSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: ""
  });

  useEffect(() => {
    const loadVendorData = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setVendorData({
          name: data.name || "",
          contact_person: data.contact_person || "",
          phone: data.phone || "",
          email: data.email || user.email || "",
          address: data.address || ""
        });
      }
    };

    loadVendorData();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          name: vendorData.name,
          contact_person: vendorData.contact_person,
          phone: vendorData.phone,
          address: vendorData.address
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your account settings have been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={vendorData.name}
                onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={vendorData.contact_person}
                onChange={(e) => setVendorData({ ...vendorData, contact_person: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={vendorData.phone}
                onChange={(e) => setVendorData({ ...vendorData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={vendorData.email}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={vendorData.address}
              onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAccountSettings;
