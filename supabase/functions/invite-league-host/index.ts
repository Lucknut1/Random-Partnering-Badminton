import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sesi super admin tidak tersedia.');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const actorClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });

    const { data: access, error: accessError } = await actorClient.rpc('my_access_context');
    if (accessError || !access?.is_super_admin) {
      return new Response(JSON.stringify({ error: 'Hanya super admin yang dapat mengirim undangan.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const leagueId = String(body.leagueId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const redirectTo = String(body.redirectTo || '').trim();
    if (!leagueId || !email) throw new Error('Liga dan email wajib diisi.');

    const { data: invitation, error: invitationError } = await actorClient
      .rpc('create_league_host_invitation', {
        target_league_id: leagueId,
        target_email: email,
      });
    if (invitationError) throw invitationError;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || undefined,
      data: { invited_as: 'league_host', league_id: leagueId },
    });

    const alreadyRegistered = Boolean(emailError?.message.toLowerCase().includes('already'));
    let existingUserEmailError: Error | null = null;
    if (alreadyRegistered) {
      const mailClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
      const { error: magicLinkError } = await mailClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectTo || undefined,
        },
      });
      existingUserEmailError = magicLinkError;
    }

    if ((emailError && !alreadyRegistered) || existingUserEmailError) {
      await actorClient.rpc('revoke_league_host_invitation', {
        target_invitation_id: invitation.id,
      });
      throw new Error(`Email undangan gagal dikirim: ${(existingUserEmailError || emailError)?.message}`);
    }

    return new Response(JSON.stringify({
      invitation,
      emailSent: !emailError || (alreadyRegistered && !existingUserEmailError),
      warning: alreadyRegistered
        ? 'Akun sudah terdaftar. Magic link undangan telah dikirim dan akses aktif setelah pengguna login.'
        : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Undangan gagal dikirim.',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
