import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_CAMPUS_SLUG, getAllCampuses } from '@/config/campuses';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || `/${DEFAULT_CAMPUS_SLUG}`;
  const authError = requestUrl.searchParams.get('error') || requestUrl.searchParams.get('error_description');

  if (authError) {
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.set('auth_error', authError);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data?.session?.user) {
        const redirectUrl = new URL(next, requestUrl.origin);
        redirectUrl.searchParams.set('auth_error', error?.message || 'Error al autenticar con Google');
        return NextResponse.redirect(redirectUrl);
      }

      const user = data.session.user;
      const email = (user.email || '').toLowerCase().trim();

      // Validar si el dominio del correo pertenece a alguna de las universidades permitidas
      const allowedDomains = Array.from(new Set(getAllCampuses().map((c) => c.allowedDomain.toLowerCase())));
      const isAllowed = allowedDomains.some((domain) => email.endsWith(`@${domain}`));

      if (!isAllowed) {
        // Correo no institucional: cerrar sesión inmediatamente
        await supabase.auth.signOut();
        const redirectUrl = new URL(next, requestUrl.origin);
        redirectUrl.searchParams.set('auth_error', 'domain_not_allowed');
        redirectUrl.searchParams.set('rejected_email', email);
        return NextResponse.redirect(redirectUrl);
      }

      // Usuario válido con correo institucional: sincronizar perfil en base de datos
      const rawName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
      const cleanUsername = rawName
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .slice(0, 30);
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email,
          username: cleanUsername.length >= 3 ? cleanUsername : `user_${user.id.slice(0, 5)}`,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      const redirectUrl = new URL(next, requestUrl.origin);
      redirectUrl.searchParams.set('auth_success', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
