import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/lib/supabase.server';

const ALLOWED_ADMIN_EMAILS = new Set([
  'retronaturalproducts@gmail.com',
  'msantureddy177@gmail.com',
]);

export const Route = createFileRoute('/api/admin-auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { email?: string; password?: string };
          const email = (body.email ?? '').trim().toLowerCase();
          const password = body.password ?? '';

          if (!email || !password) {
            return Response.json({ error: 'Email and password are required.' }, { status: 400 });
          }

          if (!ALLOWED_ADMIN_EMAILS.has(email)) {
            return Response.json({ error: 'Access denied. This email is not authorized for admin access.' }, { status: 403 });
          }

          const adminClient = supabaseAdmin();
          const { data, error } = await adminClient.auth.signInWithPassword({ email, password });

          if (error || !data.session || !data.user) {
            return Response.json(
              { error: error?.message || 'Invalid email or password.' },
              { status: 401 },
            );
          }

          const signedInEmail = (data.user.email ?? '').toLowerCase();
          if (!ALLOWED_ADMIN_EMAILS.has(signedInEmail)) {
            return Response.json({ error: 'Access denied. This email is not authorized for admin access.' }, { status: 403 });
          }

          return Response.json({
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              expires_at: data.session.expires_at,
              token_type: data.session.token_type,
              user: data.session.user,
            },
          });
        } catch (error) {
          console.error('Admin authentication proxy error:', error);
          return Response.json(
            { error: error instanceof Error ? error.message : 'Unable to sign in right now.' },
            { status: 500 },
          );
        }
      },
    },
  },
});
