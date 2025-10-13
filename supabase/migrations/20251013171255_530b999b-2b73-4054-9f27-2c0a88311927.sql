-- Add password column to customers table
ALTER TABLE public.customers 
ADD COLUMN password text;

-- Add password column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN password text;

-- Add comment to indicate this is for development/testing only
COMMENT ON COLUMN public.customers.password IS 'Development only - stores password in plain text for testing';
COMMENT ON COLUMN public.vendors.password IS 'Development only - stores password in plain text for testing';