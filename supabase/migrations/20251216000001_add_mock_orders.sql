-- Add mock orders with proper timestamps
-- This migration adds sample order data with created_at timestamps to test the order details display

-- Insert mock orders for existing customers with various timestamps
INSERT INTO orders (
  customer_id,
  vendor_id,
  product_id,
  order_date,
  quantity,
  unit,
  total_amount,
  status,
  created_at
)
SELECT 
  c.id as customer_id,
  v.id as vendor_id,
  p.id as product_id,
  CURRENT_DATE as order_date,
  2 as quantity,
  'litre' as unit,
  100.00 as total_amount,
  'pending' as status,
  NOW() - INTERVAL '2 hours' as created_at
FROM customers c
CROSS JOIN vendors v
CROSS JOIN products p
WHERE c.name LIKE '%Vikram%'
  AND v.name LIKE '%Swara%'
  AND p.name LIKE '%Milk%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add another mock order from yesterday
INSERT INTO orders (
  customer_id,
  vendor_id,
  product_id,
  order_date,
  quantity,
  unit,
  total_amount,
  status,
  created_at
)
SELECT 
  c.id as customer_id,
  v.id as vendor_id,
  p.id as product_id,
  CURRENT_DATE - INTERVAL '1 day' as order_date,
  1 as quantity,
  'litre' as unit,
  50.00 as total_amount,
  'delivered' as status,
  NOW() - INTERVAL '1 day 3 hours' as created_at
FROM customers c
CROSS JOIN vendors v
CROSS JOIN products p
WHERE c.name LIKE '%Vikram%'
  AND v.name LIKE '%Swara%'
  AND p.name LIKE '%Milk%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add a future scheduled order
INSERT INTO orders (
  customer_id,
  vendor_id,
  product_id,
  order_date,
  quantity,
  unit,
  total_amount,
  status,
  created_at
)
SELECT 
  c.id as customer_id,
  v.id as vendor_id,
  p.id as product_id,
  CURRENT_DATE + INTERVAL '1 day' as order_date,
  3 as quantity,
  'litre' as unit,
  150.00 as total_amount,
  'pending' as status,
  NOW() - INTERVAL '30 minutes' as created_at
FROM customers c
CROSS JOIN vendors v
CROSS JOIN products p
WHERE c.name LIKE '%Vikram%'
  AND v.name LIKE '%Swara%'
  AND p.name LIKE '%Milk%'
LIMIT 1
ON CONFLICT DO NOTHING;
