-- Drop the foreign key constraint that prevents null customer_id for guest orders
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;