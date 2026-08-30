import { createClient, Session } from '@supabase/supabase-js';
import {
  AccessContext,
  CheckInRecord,
  League,
  LeagueHostAssignment,
  LeagueHostInvitation,
  Match,
  Player,
} from '../types';

export interface AppSnapshot {
  leagues: League[];
  players: Player[];
  matches: Match[];
  checkIns: CheckInRecord[];
  updatedAt?: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const supabaseService = {
  async loadSnapshot(): Promise<AppSnapshot | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('app_state')
      .select('payload, updated_at')
      .eq('id', 'primary')
      .maybeSingle();
    if (error) throw error;
    if (!data?.payload) return null;
    return { ...(data.payload as AppSnapshot), updatedAt: data.updated_at };
  },

  async saveSnapshot(snapshot: AppSnapshot): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('app_state').upsert({
      id: 'primary',
      payload: snapshot,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async signIn(email: string, password: string): Promise<Session> {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Sesi login tidak tersedia.');
    return data.session;
  },

  async signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
    sessionStorage.removeItem('shuttlerank_local_admin');
  },

  async setInvitedUserPassword(password: string): Promise<void> {
    if (!supabase) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        ...(userData.user?.user_metadata || {}),
        password_configured: true,
      },
    });
    if (error) throw error;
  },

  async cancelActiveMatch(matchId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('cancel_active_match', {
      target_match_id: matchId,
    });
    if (error) throw error;
  },

  async isSuperAdmin(userId?: string): Promise<boolean> {
    if (!supabase || !userId) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.role === 'super_admin';
  },

  async getAccessContext(): Promise<AccessContext> {
    if (!supabase) {
      return { isSuperAdmin: this.localAdminActive(), hostedLeagueIds: [] };
    }
    const { data, error } = await supabase.rpc('my_access_context');
    if (error) throw error;
    const context = data as { is_super_admin?: boolean; hosted_league_ids?: string[] } | null;
    return {
      isSuperAdmin: Boolean(context?.is_super_admin),
      hostedLeagueIds: Array.isArray(context?.hosted_league_ids) ? context.hosted_league_ids : [],
    };
  },

  async acceptPendingHostInvitations(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('accept_my_league_host_invitations');
    if (error) throw error;
  },

  async listLeagueHostAccess(): Promise<{
    invitations: LeagueHostInvitation[];
    hosts: LeagueHostAssignment[];
  }> {
    if (!supabase) return { invitations: [], hosts: [] };
    const [invitationResult, hostResult] = await Promise.all([
      supabase
        .from('league_host_invitations')
        .select('id, league_id, email, status, expires_at, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('league_hosts')
        .select('league_id, user_id, status, assigned_at, league_host_invitations(email)')
        .eq('status', 'active')
        .order('assigned_at', { ascending: false }),
    ]);
    if (invitationResult.error) throw invitationResult.error;
    if (hostResult.error) throw hostResult.error;
    return {
      invitations: (invitationResult.data || []) as LeagueHostInvitation[],
      hosts: (hostResult.data || []) as unknown as LeagueHostAssignment[],
    };
  },

  async inviteLeagueHost(leagueId: string, email: string): Promise<{ emailSent: boolean; warning?: string }> {
    if (!supabase) throw new Error('Undangan host memerlukan Supabase.');
    const { data, error } = await supabase.functions.invoke('invite-league-host', {
      body: { leagueId, email, redirectTo: window.location.origin },
    });
    if (error) throw error;
    return { emailSent: Boolean(data?.emailSent), warning: data?.warning };
  },

  async revokeLeagueHost(leagueId: string, userId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('revoke_league_host', {
      target_league_id: leagueId,
      target_user_id: userId,
    });
    if (error) throw error;
  },

  async revokeLeagueHostInvitation(invitationId: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.rpc('revoke_league_host_invitation', {
      target_invitation_id: invitationId,
    });
    if (error) throw error;
  },

  async updateLeagueOperationalInfo(league: League): Promise<League> {
    if (!supabase) return league;
    const { data, error } = await supabase.rpc('update_league_operational_info', {
      target_league_id: league.id,
      target_info: {
        name: league.name,
        venue: league.venue,
        courtsCount: league.courtsCount,
        startTime: league.startTime,
        endTime: league.endTime,
        defaultFormat: league.defaultFormat,
        description: league.description,
      },
    });
    if (error) throw error;
    return data as League;
  },

  async verifyMatchResult(matchId: string): Promise<Match> {
    if (!supabase) throw new Error('Verifikasi hasil memerlukan Supabase.');
    const { data, error } = await supabase.rpc('verify_match_result', {
      target_match_id: matchId,
    });
    if (error) throw error;
    return data as Match;
  },

  async correctMatchResult(
    matchId: string,
    teamAScore: number,
    teamBScore: number,
    reason: string
  ): Promise<Match> {
    if (!supabase) throw new Error('Koreksi hasil memerlukan Supabase.');
    const { data, error } = await supabase.rpc('correct_match_result', {
      target_match_id: matchId,
      target_team_a_score: teamAScore,
      target_team_b_score: teamBScore,
      target_reason: reason,
    });
    if (error) throw error;
    return data as Match;
  },

  async registerLeaguePlayer(player: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
    if (!supabase) {
      return {
        ...player,
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
    }
    const { data, error } = await supabase.rpc('register_league_player', {
      target_league_id: player.leagueId,
      target_full_name: player.name,
      target_department: player.department,
      target_level: player.level,
      target_gender: player.gender,
    });
    if (error) throw error;
    return data as Player;
  },

  localAdminAvailable(): boolean {
    // Mode PIN lokal hanya diizinkan pada lingkungan pengembangan lokal (DEV), dinonaktifkan di build produksi
    if (import.meta.env.PROD) return false;
    return Boolean(import.meta.env.VITE_LOCAL_ADMIN_PIN?.trim());
  },

  localAdminActive(): boolean {
    if (import.meta.env.PROD) return false;
    return sessionStorage.getItem('shuttlerank_local_admin') === 'true';
  },

  signInLocal(pin: string): boolean {
    if (import.meta.env.PROD) return false;
    const expectedPin = import.meta.env.VITE_LOCAL_ADMIN_PIN?.trim();
    const valid = Boolean(expectedPin) && pin === expectedPin;
    if (valid) sessionStorage.setItem('shuttlerank_local_admin', 'true');
    return valid;
  },
};
