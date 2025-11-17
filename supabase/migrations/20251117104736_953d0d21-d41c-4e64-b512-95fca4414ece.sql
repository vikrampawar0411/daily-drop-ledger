-- Add original_start_date to subscriptions table to preserve the initial start date
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS original_start_date date;

-- Set existing records' original_start_date to their current start_date
UPDATE subscriptions 
SET original_start_date = start_date 
WHERE original_start_date IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE subscriptions 
ALTER COLUMN original_start_date SET NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN subscriptions.original_start_date IS 'The original date when the subscription first started, preserved even after pause/resume cycles';