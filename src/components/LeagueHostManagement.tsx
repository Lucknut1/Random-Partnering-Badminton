import React, { useEffect, useState } from 'react';
import { MailPlus, RefreshCw, ShieldCheck, UserX, XCircle, Users, Clock, AlertCircle } from 'lucide-react';
import { League, LeagueHostAssignment, LeagueHostInvitation } from '../types';
import { isSupabaseConfigured, supabaseService } from '../services/supabaseService';

interface LeagueHostManagementProps {
  leagues: League[];
  activeLeagueId?: string;
}

export const LeagueHostManagement: React.FC<LeagueHostManagementProps> = ({ leagues, activeLeagueId }) => {
  const [leagueId, setLeagueId] = useState(activeLeagueId || leagues[0]?.id || '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hosts, setHosts] = useState<LeagueHostAssignment[]>([]);
  const [invitations, setInvitations] = useState<LeagueHostInvitation[]>([]);

  const loadAccess = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError('');
    try {
      const { hosts: hostList, invitations: invitationList } = await supabaseService.listLeagueHostAccess();
      setHosts(hostList);
      setInvitations(invitationList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data akses host.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccess();
  }, []);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await supabaseService.inviteLeagueHost(leagueId, email.trim());
      setEmail('');
      setMessage(result.warning || (result.emailSent ? 'Email undangan berhasil dikirim.' : 'Undangan berhasil dibuat.'));
      await loadAccess();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Undangan gagal dikirim.');
    } finally {
      setLoading(false);
    }
  };

  const revokeHost = async (host: LeagueHostAssignment) => {
    const targetEmail = host.league_host_invitations?.email || host.user_id;
    if (!confirm(`Cabut akses host untuk ${targetEmail}?`)) return;
    setLoading(true);
    setError('');
    try {
      await supabaseService.revokeLeagueHost(host.league_id, host.user_id);
      await loadAccess();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Akses host gagal dicabut.');
    } finally {
      setLoading(false);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!confirm('Batalkan undangan host ini?')) return;
    setLoading(true);
    setError('');
    try {
      await supabaseService.revokeLeagueHostInvitation(invitationId);
      await loadAccess();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Undangan gagal dibatalkan.');
    } finally {
      setLoading(false);
    }
  };

  const leagueName = (id: string) => leagues.find((league) => league.id === id)?.name || id;

  if (!isSupabaseConfigured) {
    return (
      <div className="clean-card p-5 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xs">
        Pengelolaan akun host hanya tersedia ketika koneksi database cloud (Supabase) aktif.
      </div>
    );
  }

  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending');

  return (
    <section className="space-y-4" aria-labelledby="league-host-management-title">
      <div>
        <h2 id="league-host-management-title" className="flex items-center gap-2 text-lg font-black text-[#0B50A1] font-['Outfit'] uppercase">
          <ShieldCheck size={20} />
          <span>Penunjukan Host Liga</span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-600 font-medium">
          Host hanya dapat mengelola informasi sesi, verifikasi pertandingan, dan koreksi skor pada liga yang ditugaskan.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: Kirim Undangan Form (5 Cols - Proportional) */}
        <form onSubmit={handleInvite} className="clean-card bg-white p-5 space-y-4 border border-[#CBD5E1] shadow-xs lg:col-span-5 h-fit">
          <div className="border-b border-[#E2E8F0] pb-2.5">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
              <MailPlus size={16} className="text-[#0B50A1]" />
              <span>Kirim Undangan Host</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Tugaskan penanggung jawab untuk liga tertentu</p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                Pilih Liga Target *
              </label>
              <select
                value={leagueId}
                onChange={(event) => setLeagueId(event.target.value)}
                required
                className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
              >
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">
                Alamat Email Calon Host *
              </label>
              <input
                type="email"
                placeholder="nama.host@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
              />
            </div>
          </div>

          {message && (
            <p className="rounded-xs bg-[#EDF9F0] border border-[#A3E3B1] p-2.5 text-xs text-[#157327] font-bold">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xs bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 font-bold flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !leagueId}
            className="btn-yonex-action w-full py-2.5 text-xs font-black justify-center disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'KIRIM UNDANGAN HOST'}
          </button>
        </form>

        {/* Right Column: Host Aktif & Undangan Menunggu (7 Cols - Filled & Proportional) */}
        <div className="clean-card bg-white p-5 space-y-5 border border-[#CBD5E1] shadow-xs lg:col-span-7">
          {/* Host Aktif */}
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#0B50A1]" />
                <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
                  Daftar Host Aktif ({hosts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => void loadAccess()}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-[#0B50A1] rounded-xs hover:bg-[#F1F5F9] transition"
                aria-label="Muat ulang daftar host"
                title="Muat ulang data"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {hosts.length === 0 ? (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xs text-xs text-slate-500 text-center font-medium">
                Belum ada host aktif yang ditugaskan. Kirim undangan di sebelah kiri untuk menambah host liga.
              </div>
            ) : (
              <div className="space-y-2">
                {hosts.map((host) => (
                  <div
                    key={`${host.league_id}-${host.user_id}`}
                    className="flex items-center justify-between gap-3 rounded-xs border border-[#CBD5E1] bg-[#F8FAFC] p-3 hover:bg-[#F0F6FD] transition"
                  >
                    <div>
                      <p className="text-xs font-black text-[#0F172A] uppercase">
                        {host.league_host_invitations?.email || host.user_id}
                      </p>
                      <p className="text-[11px] font-bold text-[#0B50A1]">
                        Penanggung Jawab: {leagueName(host.league_id)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void revokeHost(host)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded-xs border border-red-200 bg-white hover:bg-red-50 transition flex items-center gap-1 uppercase"
                      aria-label="Cabut akses host"
                    >
                      <UserX size={13} />
                      <span>Cabut</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Undangan Menunggu */}
          <div className="border-t border-[#E2E8F0] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[#0B50A1]" />
              <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
                Undangan Menunggu Konfirmasi ({pendingInvitations.length})
              </h3>
            </div>

            {pendingInvitations.length === 0 ? (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xs text-xs text-slate-500 text-center font-medium">
                Tidak ada undangan yang sedang menunggu.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between gap-3 rounded-xs border border-[#CBD5E1] bg-[#F8FAFC] p-3 hover:bg-amber-50/50 transition"
                  >
                    <div>
                      <p className="text-xs font-black text-[#0F172A]">{invitation.email}</p>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {leagueName(invitation.league_id)} · Berlaku s.d. {new Date(invitation.expires_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void revokeInvitation(invitation.id)}
                      className="text-xs text-slate-500 hover:text-red-600 font-bold p-1"
                      aria-label="Batalkan undangan"
                      title="Batalkan Undangan"
                    >
                      <XCircle size={15} />
                    </button>
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

export default LeagueHostManagement;
