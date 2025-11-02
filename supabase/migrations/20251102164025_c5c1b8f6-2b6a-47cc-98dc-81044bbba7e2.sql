-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the subscription order generation to run daily at midnight
SELECT cron.schedule(
  'generate-subscription-orders-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
  SELECT net.http_post(
    url:='https://ssaogbrpjvxvlxtdivah.supabase.co/functions/v1/generate-subscription-orders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYW9nYnJwanZ4dmx4dGRpdmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzE1OTIsImV4cCI6MjA3NTAwNzU5Mn0.QQn4MgbPVHi83q5jWwL5qYJNrwnFylHlUyawK_bJaiM"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);