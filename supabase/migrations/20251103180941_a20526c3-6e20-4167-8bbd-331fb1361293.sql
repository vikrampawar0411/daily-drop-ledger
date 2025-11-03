-- Add address column to societies table
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS address TEXT;