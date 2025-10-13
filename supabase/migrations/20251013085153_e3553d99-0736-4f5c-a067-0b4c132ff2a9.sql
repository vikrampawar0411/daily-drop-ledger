-- Drop the check constraint that prevents null customer_id
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_customer_id_check;