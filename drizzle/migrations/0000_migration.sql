CREATE TABLE public.story_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  notes text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_progress TO authenticated;
GRANT ALL ON public.story_progress TO service_role;
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.story_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.story_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.story_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.story_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);