-- Create areas table for vendor-managed areas
CREATE TABLE IF NOT EXISTS public.areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, name)
);

-- Create societies table for vendor-managed societies
CREATE TABLE IF NOT EXISTS public.societies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(area_id, name)
);

-- Add new columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS society_id uuid REFERENCES public.societies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS wing_number text,
ADD COLUMN IF NOT EXISTS flat_plot_house_number text;

-- Enable RLS on new tables
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;

-- RLS policies for areas
CREATE POLICY "Admins and staff can view all areas"
ON public.areas FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can create areas"
ON public.areas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update areas"
ON public.areas FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete areas"
ON public.areas FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public users can view areas"
ON public.areas FOR SELECT
USING (true);

-- RLS policies for societies
CREATE POLICY "Admins and staff can view all societies"
ON public.societies FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can create societies"
ON public.societies FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update societies"
ON public.societies FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete societies"
ON public.societies FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public users can view societies"
ON public.societies FOR SELECT
USING (true);

-- Add trigger for updated_at on areas
CREATE TRIGGER update_areas_updated_at
BEFORE UPDATE ON public.areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on societies
CREATE TRIGGER update_societies_updated_at
BEFORE UPDATE ON public.societies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();