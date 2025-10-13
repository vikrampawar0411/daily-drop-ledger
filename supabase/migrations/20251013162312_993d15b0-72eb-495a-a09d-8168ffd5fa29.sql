-- Create states table
CREATE TABLE public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create cities table
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(state_id, name)
);

-- Add city_id to areas table
ALTER TABLE public.areas 
ADD COLUMN city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_cities_state_id ON public.cities(state_id);
CREATE INDEX idx_areas_city_id ON public.areas(city_id);

-- Enable RLS on states table
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

-- RLS policies for states
CREATE POLICY "All users can view active states"
  ON public.states FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage states"
  ON public.states FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on cities table
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- RLS policies for cities
CREATE POLICY "All users can view active cities"
  ON public.cities FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage cities"
  ON public.cities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_states_updated_at
  BEFORE UPDATE ON public.states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();