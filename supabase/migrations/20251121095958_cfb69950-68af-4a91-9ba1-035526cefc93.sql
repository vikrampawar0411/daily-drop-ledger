-- Create customer_notifications table for product deactivation notifications
CREATE TABLE IF NOT EXISTS customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  vendor_contact TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for customer notifications
CREATE POLICY "Customers can view their own notifications"
ON customer_notifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = customer_notifications.customer_id
  AND c.user_id = auth.uid()
));

CREATE POLICY "Customers can update their own notifications"
ON customer_notifications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = customer_notifications.customer_id
  AND c.user_id = auth.uid()
));

CREATE POLICY "Vendors can create notifications"
ON customer_notifications FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM vendors v
  WHERE v.id = customer_notifications.vendor_id
  AND v.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all notifications"
ON customer_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_customer_notifications_customer_id ON customer_notifications(customer_id);
CREATE INDEX idx_customer_notifications_is_read ON customer_notifications(is_read);