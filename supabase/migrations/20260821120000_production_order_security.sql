-- Production order/payment hardening.
-- Server code should be the only writer because it uses the Supabase service role.

alter table public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_method text not null default 'cod',
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cod', 'online'));

create unique index if not exists orders_razorpay_order_id_uidx
  on public.orders (razorpay_order_id)
  where razorpay_order_id is not null;

create unique index if not exists orders_razorpay_payment_id_uidx
  on public.orders (razorpay_payment_id)
  where razorpay_payment_id is not null;

-- Never expose customer orders to anonymous/public clients.
alter table public.orders enable row level security;
drop policy if exists "Public can insert orders" on public.orders;
drop policy if exists "Public can read orders" on public.orders;
drop policy if exists "Public can update orders" on public.orders;
