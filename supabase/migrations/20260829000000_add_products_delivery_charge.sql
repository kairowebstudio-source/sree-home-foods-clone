-- Add optional delivery charge per product (admin-settable)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC;
