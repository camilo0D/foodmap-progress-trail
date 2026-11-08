CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '',
 management_type text CHECK (management_type IN ('store','projects','services','finance')),
 workspace_name text NOT NULL DEFAULT '',
 currency text NOT NULL DEFAULT 'COP' CHECK (currency IN ('COP','USD','EUR')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_management_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, display_name, management_type, workspace_name)
 VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), CASE WHEN NEW.raw_user_meta_data->>'management_type' IN ('store','projects','services','finance') THEN NEW.raw_user_meta_data->>'management_type' ELSE NULL END, coalesce(NEW.raw_user_meta_data->>'workspace_name',''))
 ON CONFLICT (id) DO NOTHING;
 RETURN NEW;
END; $$;
CREATE TRIGGER on_management_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_management_profile();
INSERT INTO public.profiles (id, display_name) SELECT id, coalesce(raw_user_meta_data->>'full_name','') FROM auth.users ON CONFLICT (id) DO NOTHING;
CREATE TABLE public.management_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 management_type text NOT NULL CHECK (management_type IN ('store','projects','services','finance')),
 kind text NOT NULL CHECK (kind IN ('product','sale','customer','order','expense','task','appointment','job','income','budget')),
 title text NOT NULL,
 amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
 quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
 entry_date date NOT NULL DEFAULT current_date,
 detail text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT valid_management_kind CHECK (
 (management_type = 'store' AND kind IN ('product','sale','customer','order','expense')) OR
 (management_type = 'projects' AND kind IN ('task','expense')) OR
 (management_type = 'services' AND kind IN ('customer','appointment','job','income','expense')) OR
 (management_type = 'finance' AND kind IN ('income','expense','budget'))
 )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.management_entries TO authenticated;
GRANT ALL ON public.management_entries TO service_role;
ALTER TABLE public.management_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own entries read" ON public.management_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own entries insert" ON public.management_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own entries update" ON public.management_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own entries delete" ON public.management_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX management_entries_owner_type ON public.management_entries (user_id, management_type);
