-- Seed sample data for vendors
INSERT INTO public.vendors (name, category, contact_person, phone, email, address) VALUES
('Fresh Dairy Co.', 'Dairy', 'Rajesh Kumar', '9876543210', 'rajesh@freshdairy.com', 'Shop 12, MG Road'),
('News Express', 'Newspaper', 'Amit Shah', '9876543211', 'amit@newsexpress.com', 'Shop 5, Station Road'),
('Daily Essentials', 'Mixed', 'Priya Sharma', '9876543212', 'priya@dailyessentials.com', 'Shop 8, Main Street');

-- Seed sample products
INSERT INTO public.products (vendor_id, name, category, price, unit, availability) VALUES
((SELECT id FROM public.vendors WHERE name = 'Fresh Dairy Co.' LIMIT 1), 'Fresh Milk', 'Dairy', 50, 'litre', 'Daily'),
((SELECT id FROM public.vendors WHERE name = 'Fresh Dairy Co.' LIMIT 1), 'Organic Milk', 'Dairy', 70, 'litre', 'Daily'),
((SELECT id FROM public.vendors WHERE name = 'News Express' LIMIT 1), 'Times of India', 'Newspaper', 5, 'copy', 'Daily'),
((SELECT id FROM public.vendors WHERE name = 'News Express' LIMIT 1), 'Maharashtra Times', 'Newspaper', 4, 'copy', 'Daily'),
((SELECT id FROM public.vendors WHERE name = 'Daily Essentials' LIMIT 1), 'Indian Express', 'Newspaper', 5, 'copy', 'Daily'),
((SELECT id FROM public.vendors WHERE name = 'Daily Essentials' LIMIT 1), 'Fresh Milk', 'Dairy', 48, 'litre', 'Daily');

-- Seed sample customers
INSERT INTO public.customers (name, phone, email, address, route) VALUES
('Sharma Family', '9876543220', 'sharma@example.com', 'A-101, Green Valley Apartments', 'Route A'),
('Patel Family', '9876543221', 'patel@example.com', 'B-205, Sunrise Towers', 'Route B'),
('Gupta Family', '9876543222', 'gupta@example.com', 'C-301, Lake View Society', 'Route A');