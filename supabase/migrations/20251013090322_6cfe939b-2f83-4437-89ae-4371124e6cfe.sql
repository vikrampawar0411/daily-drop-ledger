-- First, create profiles for any customers who have orders but no profile
INSERT INTO public.profiles (id, email, user_type)
SELECT DISTINCT o.customer_id, u.email, 'customer'
FROM public.orders o
JOIN auth.users u ON u.id = o.customer_id
WHERE o.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = o.customer_id
  );

-- Now add the foreign key constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;