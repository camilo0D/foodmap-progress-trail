CREATE TABLE public.workspace_advice (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, management_type text NOT NULL CHECK (management_type IN ('store','projects','services','finance')), goals text NOT NULL DEFAULT '', context text NOT NULL DEFAULT '', recommendation text NOT NULL DEFAULT '', generated_at timestamptz, UNIQUE(user_id, management_type));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_advice TO authenticated;
GRANT ALL ON public.workspace_advice TO service_role;
ALTER TABLE public.workspace_advice ENABLE ROW LEVEL SECURITY;
CREATE POLICY advice_owner ON public.workspace_advice FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.ai_access_blocks (feature text PRIMARY KEY, message text NOT NULL, status integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.ai_access_blocks TO service_role;
ALTER TABLE public.ai_access_blocks ENABLE ROW LEVEL SECURITY;