-- Allow vendors to delete their own vendor_products

CREATE POLICY "Vendors can delete their own products"
  ON public.vendor_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_products.vendor_id
        AND v.user_id = auth.uid()
    )
  );
