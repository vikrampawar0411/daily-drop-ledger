-- Create vendor_products table to link vendors with their products
CREATE TABLE IF NOT EXISTS public.vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_override numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, product_id)
);

-- Create product_requests table for new product approval workflow
CREATE TABLE IF NOT EXISTS public.product_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL,
  unit text NOT NULL,
  availability text NOT NULL DEFAULT 'Daily',
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by_user_id uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_products
CREATE POLICY "Admins can manage all vendor products"
  ON public.vendor_products
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can view their own products"
  ON public.vendor_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v 
      WHERE v.id = vendor_products.vendor_id 
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can add their own products"
  ON public.vendor_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v 
      WHERE v.id = vendor_products.vendor_id 
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own products"
  ON public.vendor_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v 
      WHERE v.id = vendor_products.vendor_id 
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view active vendor products"
  ON public.vendor_products
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for product_requests
CREATE POLICY "Admins can manage all product requests"
  ON public.product_requests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can view their own requests"
  ON public.product_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v 
      WHERE v.id = product_requests.vendor_id 
      AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create product requests"
  ON public.product_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors v 
      WHERE v.id = product_requests.vendor_id 
      AND v.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_vendor_products_updated_at
  BEFORE UPDATE ON public.vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_requests_updated_at
  BEFORE UPDATE ON public.product_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();