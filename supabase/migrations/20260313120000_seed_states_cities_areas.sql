-- Seed: Add sample states, cities, and areas
-- This migration provides a starting dataset for the signup dropdowns.
-- You can expand this file with additional states/cities/areas as needed.

-- Ensure areas table has vendor_id column (add if missing)
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

-- Add unique constraint on (vendor_id, name) for areas table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'areas_vendor_id_name_unique' 
        AND conrelid = 'public.areas'::regclass
    ) THEN
        ALTER TABLE public.areas ADD CONSTRAINT areas_vendor_id_name_unique UNIQUE (vendor_id, name);
    END IF;
END $$;

-- Ensure societies table has vendor_id column (add if missing)
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE;

-- Add unique constraint on (area_id, name) for societies table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'societies_area_id_name_unique' 
        AND conrelid = 'public.societies'::regclass
    ) THEN
        ALTER TABLE public.societies ADD CONSTRAINT societies_area_id_name_unique UNIQUE (area_id, name);
    END IF;
END $$;

-- 1) A "system" vendor to own the global areas (areas require a vendor_id)
INSERT INTO public.vendors (id, name, category, contact_person, phone, email, address, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System Vendor',
  'Platform',
  'System',
  NULL,
  NULL,
  'System',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2) States (unique by name)
INSERT INTO public.states (id, name, description, status)
VALUES
  ('00000000-0000-0000-0000-000000000010'::uuid, 'Maharashtra', 'State of Maharashtra', 'active'),
  ('00000000-0000-0000-0000-000000000011'::uuid, 'Karnataka', 'State of Karnataka', 'active'),
  ('00000000-0000-0000-0000-000000000012'::uuid, 'Tamil Nadu', 'State of Tamil Nadu', 'active'),
  ('00000000-0000-0000-0000-000000000013'::uuid, 'Delhi', 'National Capital Territory of Delhi', 'active')
ON CONFLICT (name) DO NOTHING;

-- 3) Cities (unique per state)
INSERT INTO public.cities (id, state_id, name, description, status)
SELECT 
  c.id::uuid,
  s.id as state_id,
  c.name,
  c.description,
  c.status
FROM (VALUES
  ('00000000-0000-0000-0000-000000000020', 'Maharashtra', 'Mumbai', 'Mumbai city', 'active'),
  ('00000000-0000-0000-0000-000000000021', 'Maharashtra', 'Pune', 'Pune city', 'active'),
  ('00000000-0000-0000-0000-000000000022', 'Maharashtra', 'Nagpur', 'Nagpur city', 'active'),
  ('00000000-0000-0000-0000-000000000023', 'Maharashtra', 'Nashik', 'Nashik city', 'active'),
  ('00000000-0000-0000-0000-000000000024', 'Maharashtra', 'Aurangabad', 'Aurangabad city', 'active'),
  ('00000000-0000-0000-0000-000000000025', 'Maharashtra', 'Thane', 'Thane city', 'active'),
  ('00000000-0000-0000-0000-000000000026', 'Karnataka', 'Bengaluru', 'Bengaluru city', 'active'),
  ('00000000-0000-0000-0000-000000000027', 'Tamil Nadu', 'Chennai', 'Chennai city', 'active'),
  ('00000000-0000-0000-0000-000000000028', 'Delhi', 'New Delhi', 'New Delhi city', 'active')
) AS c(id, state_name, name, description, status)
JOIN public.states s ON s.name = c.state_name
ON CONFLICT (state_id, name) DO UPDATE SET description = EXCLUDED.description, status = EXCLUDED.status;

-- 4) Areas (global areas, owned by the system vendor)
-- NOTE: The areas table requires a vendor_id; we use the System Vendor above.
INSERT INTO public.areas (id, vendor_id, city_id, name, created_at, updated_at)
SELECT 
  a.id::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid as vendor_id,
  c.id as city_id,
  a.name,
  now() as created_at,
  now() as updated_at
FROM (VALUES
  ('00000000-0000-0000-0000-000000000030', 'Maharashtra', 'Mumbai', 'South Mumbai'),
  ('00000000-0000-0000-0000-000000000031', 'Maharashtra', 'Mumbai', 'Andheri'),
  ('00000000-0000-0000-0000-000000000032', 'Maharashtra', 'Mumbai', 'Bandra'),
  ('00000000-0000-0000-0000-000000000033', 'Maharashtra', 'Mumbai', 'Juhu'),
  ('00000000-0000-0000-0000-000000000034', 'Maharashtra', 'Pune', 'Kothrud'),
  ('00000000-0000-0000-0000-000000000035', 'Maharashtra', 'Pune', 'Aundh'),
  ('00000000-0000-0000-0000-000000000036', 'Maharashtra', 'Pune', 'Wakad'),
  ('00000000-0000-0000-0000-000000000037', 'Maharashtra', 'Pune', 'Hinjewadi'),
  ('00000000-0000-0000-0000-000000000038', 'Maharashtra', 'Nagpur', 'Dharampeth'),
  ('00000000-0000-0000-0000-000000000039', 'Maharashtra', 'Nagpur', 'Civil Lines'),
  ('00000000-0000-0000-0000-000000000040', 'Maharashtra', 'Nagpur', 'Sadar'),
  ('00000000-0000-0000-0000-000000000041', 'Maharashtra', 'Nashik', 'College Road'),
  ('00000000-0000-0000-0000-000000000042', 'Maharashtra', 'Nashik', 'Panchavati'),
  ('00000000-0000-0000-0000-000000000043', 'Maharashtra', 'Aurangabad', 'CIDCO'),
  ('00000000-0000-0000-0000-000000000044', 'Maharashtra', 'Aurangabad', 'Nirala Bazar'),
  ('00000000-0000-0000-0000-000000000045', 'Maharashtra', 'Thane', 'Thane West'),
  ('00000000-0000-0000-0000-000000000046', 'Maharashtra', 'Thane', 'Ghodbunder Road'),
  ('00000000-0000-0000-0000-000000000047', 'Karnataka', 'Bengaluru', 'Jayanagar'),
  ('00000000-0000-0000-0000-000000000048', 'Tamil Nadu', 'Chennai', 'Adyar'),
  ('00000000-0000-0000-0000-000000000049', 'Delhi', 'New Delhi', 'Connaught Place')
) AS a(id, state_name, city_name, name)
JOIN public.states s ON s.name = a.state_name
JOIN public.cities c ON c.name = a.city_name AND c.state_id = s.id
ON CONFLICT (id) DO UPDATE SET vendor_id = EXCLUDED.vendor_id, city_id = EXCLUDED.city_id;

-- 5) Societies (sample societies for areas, owned by the system vendor)
INSERT INTO public.societies (id, vendor_id, area_id, name, status, created_at, updated_at)
SELECT 
  s.id::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid as vendor_id,
  a.id as area_id,
  s.name,
  'active' as status,
  now() as created_at,
  now() as updated_at
FROM (VALUES
  ('00000000-0000-0000-0000-000000000050', 'South Mumbai', 'Marine Drive Society'),
  ('00000000-0000-0000-0000-000000000051', 'South Mumbai', 'Colaba Heights'),
  ('00000000-0000-0000-0000-000000000052', 'Andheri', 'Andheri West Apartments'),
  ('00000000-0000-0000-0000-000000000053', 'Andheri', 'Versova Society'),
  ('00000000-0000-0000-0000-000000000054', 'Kothrud', 'Kothrud Heights'),
  ('00000000-0000-0000-0000-000000000055', 'Kothrud', 'Paud Road Society'),
  ('00000000-0000-0000-0000-000000000056', 'Dharampeth', 'Dharampeth Colony'),
  ('00000000-0000-0000-0000-000000000057', 'College Road', 'College Road Apartments'),
  ('00000000-0000-0000-0000-000000000058', 'CIDCO', 'CIDCO N-6'),
  ('00000000-0000-0000-0000-000000000059', 'Thane West', 'Thane West Society'),
  ('00000000-0000-0000-0000-000000000060', 'Jayanagar', 'Jayanagar 4th Block'),
  ('00000000-0000-0000-0000-000000000061', 'Adyar', 'Adyar Apartments'),
  ('00000000-0000-0000-0000-000000000062', 'Connaught Place', 'Connaught Place Complex')
) AS s(id, area_name, name)
JOIN public.areas a ON a.name = s.area_name
ON CONFLICT (id) DO NOTHING;
