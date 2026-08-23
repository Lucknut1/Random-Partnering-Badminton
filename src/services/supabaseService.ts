import { createClient, Session } from '@supabase/supabase-js';
import { CheckInRecord, League, Match, Player } from '../types';

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

  localAdminAvailable(): boolean {
    return Boolean(import.meta.env.VITE_LOCAL_ADMIN_PIN?.trim());
  },

  localAdminActive(): boolean {
    return sessionStorage.getItem('shuttlerank_local_admin') === 'true';
  },

  signInLocal(pin: string): boolean {
    const expectedPin = import.meta.env.VITE_LOCAL_ADMIN_PIN?.trim();
    const valid = Boolean(expectedPin) && pin === expectedPin;
    if (valid) sessionStorage.setItem('shuttlerank_local_admin', 'true');
    return valid;
  },
};
