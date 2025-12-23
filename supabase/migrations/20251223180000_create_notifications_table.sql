-- Create notifications table for user/vendor messages and system events
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL, -- references profiles(id) or auth.users(id)
  sender_user_id UUID, -- optional, for vendor/user/system
  order_id UUID, -- optional, for order-related notifications
  vendor_id UUID, -- optional, for vendor-related notifications
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g. 'order_update', 'bulk_message', 'system', etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON public.notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_vendor_id ON public.notifications(vendor_id);

-- Policy: Only recipient can read/update their notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (recipient_user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (recipient_user_id = auth.uid());
