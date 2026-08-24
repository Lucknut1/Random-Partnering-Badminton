import React, { useCallback, useEffect, useState } from 'react';
import { MailPlus, RefreshCw, ShieldCheck, UserX, XCircle } from 'lucide-react';
import { League, LeagueHostAssignment, LeagueHostInvitation } from '../types';
import { isSupabaseConfigured, supabaseService } from '../services/supabaseService';

interface LeagueHostManagementProps {
  leagues: League[];
}

export const LeagueHostManagement: React.FC<LeagueHostManagementProps> = ({ leagues }) => {
  const [leagueId, setLeagueId] = useState(leagues[0]?.id || '');
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState<LeagueHostInvitation[]>([]);
  const [hosts, setHosts] = useState<LeagueHostAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const leagueName = (id: string) => leagues.find((league) => league.id === id)?.name || id;

  const loadAccess = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError('');
    try {
      const access = await supabaseService.listLeagueHostAccess();
      setInvitations(access.invitations);
      setHosts(access.hosts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Data host gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccess();
  }, [loadAccess]);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await supabaseService.inviteLeagueHost(leagueId, email.trim());
      setMessage(result.warning || (result.emailSent ? 'Email undangan berhasil dikirim.' : 'Undangan berhasil dibuat.'));
      setEmail('');
      await loadAccess();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Undangan gagal dikirim.');
    } finally {
      setLoading(false);
    }
  };

  const revokeHost = async (host: LeagueHostAssignment) => {
    if (!confirm(`Cabut akses host untuk ${leagueName(host.league_id)}?`)) return;
    try {
      await supabaseService.revokeLeagueHost(host.league_id, host.user_id);
      await loadAccess();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Akses host gagal dicabut.');
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!confirm('Batalkan undangan host ini?')) return;
    try {
      await supabaseService.revokeLeagueHostInvitation(invitationId);
      await loadAccess();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Undangan gagal dibatalkan.');
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="clean-card border-amber-500/20 p-5 text-xs text-amber-200">
        Pengelolaan host hanya tersedia ketika Supabase aktif.
      </div>
    );
  }

  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending');

  return (
    <section className="space-y-4" aria-labelledby="league-host-management-title">
      <div>
        <h2 id="league-host-management-title" className="flex items-center gap-2 text-xl font-black text-amber-400">
          <ShieldCheck size={22} /> Penunjukan Host Liga
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Host hanya dapat mengelola informasi dan hasil pertandingan pada liga yang ditugaskan.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={handleInvite} className="clean-card space-y-4 p-5 lg:col-span-1">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-white"><MailPlus size={17} /> Kirim undangan</h3>
          <label className="block text-xs font-bold text-slate-300">
            Liga
            <select className="mt-1.5" value={leagueId} onChange={(event) => setLeagueId(event.target.value)} required>
              {leagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-300">
            Email calon host
            <input className="mt-1.5" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {message ? <p className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-300">{message}</p> : null}
          {error ? <p role="alert" className="rounded-lg bg-red-500/10 p-2.5 text-xs text-red-300">{error}</p> : null}
          <button type="submit" disabled={loading || !leagueId} className="btn-action-primary w-full justify-center disabled:opacity-50">
            {loading ? 'Memproses...' : 'Kirim undangan host'}
          </button>
        </form>

        <div className="clean-card space-y-4 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Host aktif</h3>
            <button type="button" onClick={() => void loadAccess()} disabled={loading} className="p-2 text-slate-400 hover:text-white" aria-label="Muat ulang daftar host">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {hosts.length === 0 ? <p className="text-xs text-slate-500">Belum ada host aktif.</p> : (
            <div className="space-y-2">
              {hosts.map((host) => (
                <div key={`${host.league_id}-${host.user_id}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/80 p-3">
                  <div>
                    <p className="text-xs font-bold text-white">{host.league_host_invitations?.email || host.user_id}</p>
                    <p className="text-[11px] text-emerald-300">{leagueName(host.league_id)}</p>
                  </div>
                  <button type="button" onClick={() => void revokeHost(host)} className="p-2 text-slate-500 hover:text-red-400" aria-label="Cabut akses host"><UserX size={15} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <h3 className="mb-2 text-sm font-extrabold text-white">Undangan menunggu</h3>
            {pendingInvitations.length === 0 ? <p className="text-xs text-slate-500">Tidak ada undangan aktif.</p> : (
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3">
                    <div>
                      <p className="text-xs font-bold text-white">{invitation.email}</p>
                      <p className="text-[11px] text-slate-400">{leagueName(invitation.league_id)} · berlaku sampai {new Date(invitation.expires_at).toLocaleDateString('id-ID')}</p>
                    </div>
                    <button type="button" onClick={() => void revokeInvitation(invitation.id)} className="p-2 text-slate-500 hover:text-red-400" aria-label="Batalkan undangan"><XCircle size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
