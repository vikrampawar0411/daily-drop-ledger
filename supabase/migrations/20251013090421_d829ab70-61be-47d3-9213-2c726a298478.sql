-- First drop existing constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- Set customer_id to NULL for orders where customer_id is not in customers table
UPDATE public.orders
SET customer_id = NULL
WHERE customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customers c WHERE c.id = orders.customer_id
  );

-- Add the correct foreign key constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.customers(id) 
ON DELETE SET NULL;