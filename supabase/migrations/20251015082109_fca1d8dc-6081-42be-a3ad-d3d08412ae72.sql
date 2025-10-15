-- Add dispute-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS dispute_raised boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dispute_reason text,
ADD COLUMN IF NOT EXISTS dispute_raised_at timestamp with time zone;