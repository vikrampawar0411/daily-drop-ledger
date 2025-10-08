-- Fix security definer view warning
-- The vendors_public view should use SECURITY INVOKER mode
-- This ensures it respects RLS policies and runs with querying user's permissions

ALTER VIEW public.vendors_public SET (security_invoker = on);