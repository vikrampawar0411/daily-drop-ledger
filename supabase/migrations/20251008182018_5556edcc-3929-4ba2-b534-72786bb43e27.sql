-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Add strict policies that explicitly prevent access to other users' profiles
CREATE POLICY "Users can only view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Explicitly deny public/anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles FOR ALL
  TO anon
  USING (false);

-- Add admin policies for user management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));