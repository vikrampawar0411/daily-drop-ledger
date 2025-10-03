-- Add explicit denial policies for anonymous/public access to customers table
-- This provides defense-in-depth even if authentication is bypassed or misconfigured

CREATE POLICY "Deny anonymous read access to customers"
  ON public.customers
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous insert access to customers"
  ON public.customers
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Deny anonymous update access to customers"
  ON public.customers
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anonymous delete access to customers"
  ON public.customers
  FOR DELETE
  TO anon
  USING (false);