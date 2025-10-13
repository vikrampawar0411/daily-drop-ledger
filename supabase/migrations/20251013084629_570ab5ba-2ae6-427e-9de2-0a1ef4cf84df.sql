-- Drop the conflicting DENY policy that blocks anonymous inserts
DROP POLICY IF EXISTS "Deny anonymous insert access to orders" ON public.orders;

-- Also clean up other redundant DENY policies for consistency
DROP POLICY IF EXISTS "Deny anonymous read access to orders" ON public.orders;
DROP POLICY IF EXISTS "Deny anonymous update access to orders" ON public.orders;
DROP POLICY IF EXISTS "Deny anonymous delete access to orders" ON public.orders;