-- Add optional stock quantity per product (admin-settable)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER;
