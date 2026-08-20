CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly viewable" ON public.categories FOR SELECT USING (true);
INSERT INTO public.categories (name, sort_order) VALUES
  ('Superfoods', 1),
  ('Spices', 2),
  ('Honey', 3),
  ('Dairy Foods', 4),
  ('Traditional', 5);
UPDATE public.products SET category = 'Superfoods' WHERE category = 'Powders';