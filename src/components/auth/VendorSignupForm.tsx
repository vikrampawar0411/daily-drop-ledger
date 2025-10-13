import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface VendorSignupFormProps {
  email: string;
  password: string;
  onSubmit: (data: VendorSignupData) => void;
  onBack: () => void;
  isLoading: boolean;
}

export interface VendorSignupData {
  email: string;
  password: string;
  businessName: string;
  category: string;
  contactPerson: string;
  phone: string;
  businessEmail: string;
  address: string;
}

const VENDOR_CATEGORIES = [
  "Milk & Dairy",
  "Newspaper & Magazines",
  "Groceries",
  "Vegetables & Fruits",
  "Water Supply",
  "Gas Cylinder",
  "Cleaning Services",
  "Other",
];

export const VendorSignupForm = ({ email, password, onSubmit, onBack, isLoading }: VendorSignupFormProps) => {
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    contactPerson: "",
    phone: "",
    businessEmail: email,
    address: "",
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
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          placeholder="Your business name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Business Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {VENDOR_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPerson">Contact Person Name *</Label>
        <Input
          id="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          placeholder="Primary contact person"
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
          placeholder="Business phone number"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessEmail">Business Email</Label>
        <Input
          id="businessEmail"
          type="email"
          value={formData.businessEmail}
          onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
          placeholder="Business email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Business Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Complete business address"
          required
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={isLoading || !formData.businessName || !formData.category || !formData.contactPerson || !formData.phone || !formData.address}
        >
          {isLoading ? "Creating account..." : "Complete Sign Up"}
        </Button>
      </div>
    </form>
  );
};
