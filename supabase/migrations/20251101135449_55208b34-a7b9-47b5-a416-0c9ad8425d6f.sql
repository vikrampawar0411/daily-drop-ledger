-- Create subscriptions table for recurring orders
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, cancelled
  paused_from DATE,
  paused_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID,
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_pause_dates CHECK (paused_until IS NULL OR paused_until >= paused_from)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Customers can manage their own subscriptions
CREATE POLICY "Customers can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = subscriptions.customer_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can create their own subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = subscriptions.customer_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = subscriptions.customer_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can delete their own subscriptions"
ON public.subscriptions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = subscriptions.customer_id
    AND c.user_id = auth.uid()
  )
);

-- Vendors can view subscriptions for their products
CREATE POLICY "Vendors can view their subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = subscriptions.vendor_id
    AND v.user_id = auth.uid()
  )
);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anonymous users can create subscriptions
CREATE POLICY "Anonymous users can create subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_vendor ON subscriptions(vendor_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();