-- Create product_edit_requests table for vendor edit approval workflow
CREATE TABLE product_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL,
  
  proposed_name TEXT,
  proposed_category TEXT,
  proposed_unit TEXT,
  proposed_description TEXT,
  proposed_subscribe_before TIME,
  proposed_delivery_before TIME,
  proposed_image_url TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by_user_id UUID,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_edit_requests_vendor ON product_edit_requests(vendor_id);
CREATE INDEX idx_product_edit_requests_status ON product_edit_requests(status);
CREATE INDEX idx_product_edit_requests_product ON product_edit_requests(product_id);

-- RLS Policies
ALTER TABLE product_edit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own requests"
ON product_edit_requests FOR SELECT
USING (EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Vendors can create requests"
ON product_edit_requests FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

CREATE POLICY "Admins can manage all"
ON product_edit_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_product_edit_requests_updated_at
BEFORE UPDATE ON product_edit_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();