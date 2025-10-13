import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    name?: string;
    phone?: string;
    area_id?: string;
    society_id?: string;
    wing_number?: string;
    flat_plot_house_number?: string;
  };
  onSubmit: (customerData: any) => void;
}

export const CustomerDetailsDialog = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: CustomerDetailsDialogProps) => {
  const { toast } = useToast();
  const { areas } = useAreas();
  const [selectedAreaId, setSelectedAreaId] = useState(initialData?.area_id || "");
  const { societies } = useSocieties(selectedAreaId);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    area_id: initialData?.area_id || "",
    society_id: initialData?.society_id || "",
    wing_number: initialData?.wing_number || "",
    flat_plot_house_number: initialData?.flat_plot_house_number || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        phone: initialData.phone || "",
        area_id: initialData.area_id || "",
        society_id: initialData.society_id || "",
        wing_number: initialData.wing_number || "",
        flat_plot_house_number: initialData.flat_plot_house_number || "",
      });
      setSelectedAreaId(initialData.area_id || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.area_id || !formData.society_id || !formData.flat_plot_house_number) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Get the selected area and society details for address construction
    const selectedArea = areas.find(a => a.id === formData.area_id);
    const selectedSociety = societies.find(s => s.id === formData.society_id);
    
    const address = [
      formData.wing_number,
      formData.flat_plot_house_number,
      selectedSociety?.name,
      selectedArea?.name
    ].filter(Boolean).join(", ");

    const customerData = {
      ...formData,
      address,
    };

    onSubmit(customerData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Please provide complete customer information for order processing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area *</Label>
            <Select
              value={formData.area_id}
              onValueChange={(value) => {
                setFormData({ ...formData, area_id: value, society_id: "" });
                setSelectedAreaId(value);
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="society">Society Name *</Label>
            <Select
              value={formData.society_id}
              onValueChange={(value) => setFormData({ ...formData, society_id: value })}
              disabled={!selectedAreaId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select society" />
              </SelectTrigger>
              <SelectContent>
                {societies.map((society) => (
                  <SelectItem key={society.id} value={society.id}>
                    {society.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wing">Wing Number</Label>
            <Input
              id="wing"
              value={formData.wing_number}
              onChange={(e) => setFormData({ ...formData, wing_number: e.target.value })}
              placeholder="Wing number (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flat">Flat / Plot / House Number *</Label>
            <Input
              id="flat"
              value={formData.flat_plot_house_number}
              onChange={(e) => setFormData({ ...formData, flat_plot_house_number: e.target.value })}
              placeholder="Flat / Plot / House number"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Details</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
