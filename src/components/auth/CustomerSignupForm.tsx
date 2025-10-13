import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAreas } from "@/hooks/useAreas";
import { useSocieties } from "@/hooks/useSocieties";

interface CustomerSignupFormProps {
  email: string;
  password: string;
  onSubmit: (data: CustomerSignupData) => void;
  onBack: () => void;
  isLoading: boolean;
}

export interface CustomerSignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  area_id: string;
  society_id: string;
  wing_number: string;
  flat_plot_house_number: string;
}

export const CustomerSignupForm = ({ email, password, onSubmit, onBack, isLoading }: CustomerSignupFormProps) => {
  const { areas } = useAreas();
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const { societies } = useSocieties(selectedAreaId);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area_id: "",
    society_id: "",
    wing_number: "",
    flat_plot_house_number: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      password,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="Your phone number"
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
            <SelectValue placeholder="Select your area" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {areas.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Please contact your vendor to add areas
          </p>
        )}
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
            <SelectValue placeholder="Select your society" />
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

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={isLoading || !formData.name || !formData.phone || !formData.area_id || !formData.society_id || !formData.flat_plot_house_number}
        >
          {isLoading ? "Creating account..." : "Complete Sign Up"}
        </Button>
      </div>
    </form>
  );
};
