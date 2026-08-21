# Production setup

## Required Vercel environment variables

Set these in Vercel for the Production environment:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` (32+ random characters)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `OWNER_EMAIL`

Do not commit real values to Git.

## Supabase

Run all files in `supabase/migrations/`, including the production order/payment migration added on 2026-08-21.

The `orders` table should remain inaccessible to anonymous clients. Server functions use the Supabase service role for trusted writes and admin reads.

## Razorpay webhook

Create a Razorpay webhook pointing to:

`https://YOUR-PRODUCTION-DOMAIN/api/razorpay-webhook`

Use the same value configured as `RAZORPAY_WEBHOOK_SECRET`.

Enable at least:

- `payment.captured`
- `payment.failed`

The webhook validates the Razorpay signature and the exact order amount before changing an order to paid.

## Resend

Verify the sending domain in Resend and set `EMAIL_FROM` to that verified domain. Set `OWNER_EMAIL` to the store owner's inbox for new-order notifications.

## Admin

The admin password is checked server-side. Successful login creates an HTTP-only encrypted session cookie. All product, order, category, and image-management server functions require that session.
