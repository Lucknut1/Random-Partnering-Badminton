import React, { useState } from 'react';
import { Player, CheckInRecord, League, Match, Gender, SkillLevel } from '../types';
import { Users, Search, Plus, UserCheck, Check, RefreshCw, Clock, X, Trophy } from 'lucide-react';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { getLocalDate } from '../services/dateService';

interface PlayersViewProps {
  players: Player[];
  checkIns: CheckInRecord[];
  activeLeague: League;
  matches: Match[];
  onRegisterPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => Promise<Player>;
  onAddCheckIn: (playerId: string, round?: number) => void;
  onRemoveCheckIn: (checkInId: string) => void;
  onBulkCheckIn: (playerIds: string[]) => void;
  canManage: boolean;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  checkIns,
  activeLeague,
  matches,
  onRegisterPlayer,
  onAddCheckIn,
  onRemoveCheckIn,
  onBulkCheckIn,
  canManage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'pria' | 'wanita'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Player Form State
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('pria');
  const [newLevel, setNewLevel] = useState<SkillLevel>('A');
  const [newDept, setNewDept] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const today = getLocalDate();
  const sessionTime = matchmakingEngine.calculateSessionTimeRemaining(activeLeague);
  const todayCheckIns = checkIns.filter(
    (c) => c.date === today && c.leagueId === activeLeague.id
  );
  const checkedInMap = new Map<string, CheckInRecord>();
  todayCheckIns.forEach((c) => checkedInMap.set(c.playerId, c));

  const leaguePlayers = players.filter(
    (p) => p.leagueId === activeLeague.id || p.leagueId === 'all'
  );

  const filteredPlayers = leaguePlayers.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGender = genderFilter === 'all' || p.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const openJoinLayer = () => {
    setRegistrationError('');
    setShowAddModal(true);
  };

  const closeJoinLayer = () => {
    if (isRegistering) return;
    setRegistrationError('');
    setShowAddModal(false);
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 3) {
      setRegistrationError('Nama lengkap minimal 3 karakter.');
      return;
    }
    if (newDept.trim().length < 2) {
      setRegistrationError('Nama divisi minimal 2 karakter.');
      return;
    }

    setIsRegistering(true);
    setRegistrationError('');
    try {
      await onRegisterPlayer({
        name: newName.trim(),
        gender: newGender,
        level: newLevel,
        department: newDept.trim(),
        leagueId: activeLeague.id,
      });
      setNewName('');
      setNewDept('');
      setNewGender('pria');
      setNewLevel('A');
      setShowAddModal(false);
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Pendaftaran belum berhasil. Coba lagi.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-['Outfit']">
            <Users className="text-emerald-400" size={22} />
            <span>Peserta & Check-In</span>
          </h1>
          <p className="text-xs text-slate-400">
            {todayCheckIns.length} dari {leaguePlayers.length} pemain telah check-in hari ini
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && <button
            onClick={() => onBulkCheckIn(leaguePlayers.map((p) => p.id))}
            className="btn-action-secondary text-xs py-1.5 px-2.5 hidden sm:inline-flex"
            title="Check-In Semua Pemain"
          >
            <Check size={13} className="text-emerald-400" />
            <span>Check-In Semua</span>
          </button>}

          <button
            onClick={openJoinLayer}
            className="btn-action-primary text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Gabung Liga</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="clean-card p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari nama pemain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg"
          />
        </div>

        {/* Gender Toggle */}
        <div className="flex items-center gap-1 bg-[#151d2a] p-0.5 rounded-lg border border-white/5 text-xs">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              genderFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setGenderFilter('pria')}
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              genderFilter === 'pria' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Putra
          </button>
          <button
            onClick={() => setGenderFilter('wanita')}
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              genderFilter === 'wanita' ? 'bg-cyan-400 text-slate-950' : 'text-slate-400'
            }`}
          >
            Putri
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="clean-card divide-y divide-white/5 overflow-hidden">
        {filteredPlayers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada pemain ditemukan.
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const checkIn = checkedInMap.get(player.id);
            const isCheckedIn = !!checkIn;
            const completedToday = matches.filter(
              (match) =>
                match.leagueId === activeLeague.id &&
                match.date === today &&
                match.status === 'COMPLETED' &&
                [match.teamA.player1Id, match.teamA.player2Id, match.teamB.player1Id, match.teamB.player2Id].includes(player.id)
            ).length;
            const hasPlayed = Math.max(checkIn?.matchesPlayedToday || 0, completedToday) > 0;
            const canRecheck = isCheckedIn && hasPlayed && sessionTime.hasTimeToPlayMore;

            return (
              <div
                key={player.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      player.gender === 'pria'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    }`}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <span>{player.name}</span>
                      <span className={`badge-lvl-${player.level.toLowerCase()}`}>
                        Lvl {player.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {player.department}
                    </div>
                  </div>
                </div>

                {/* 1-Tap Check-In Button */}
                <div>
                  {isCheckedIn ? (
                    <div className="flex items-center gap-1.5">
                      {canRecheck && (
                        <button
                          onClick={() => onAddCheckIn(player.id, checkIn.round + 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1"
                          title={`Sisa waktu ${sessionTime.remainingMinutes} menit`}
                        >
                          <RefreshCw size={13} />
                          <span>Ronde {checkIn.round + 1}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveCheckIn(checkIn.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition"
                        title="Klik untuk membatalkan check-in"
                      >
                        {hasPlayed && !sessionTime.hasTimeToPlayMore ? <Clock size={14} /> : <UserCheck size={14} />}
                        <span>{hasPlayed ? `${Math.max(checkIn.matchesPlayedToday, completedToday)}x Main` : 'Menunggu'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddCheckIn(player.id, 1)}
                      className="btn-action-primary text-xs py-1 px-3"
                    >
                      <span>Check-In</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Public league registration layer */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" role="presentation">
          <form
            onSubmit={handleCreatePlayer}
            className="clean-card w-full max-w-md space-y-5 border border-emerald-500/20 bg-[#0b1210] p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-league-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">Pendaftaran Peserta</p>
                <h2 id="join-league-title" className="text-xl font-black text-white">Gabung ke liga</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">Isi profil singkat ini satu kali sebelum mengikuti kegiatan liga.</p>
              </div>
              <button
                type="button"
                onClick={closeJoinLayer}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Tutup pendaftaran"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300"><Trophy size={17} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Liga yang dipilih</p>
                <p className="truncate text-sm font-extrabold text-white">{activeLeague.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">
                Nama lengkap
              <input
                type="text"
                  placeholder="Contoh: Aris Wicaksono"
                value={newName}
                  onChange={(event) => {
                    setNewName(event.target.value);
                    setRegistrationError('');
                  }}
                  className="mt-1.5"
                  minLength={3}
                  maxLength={80}
                  autoComplete="name"
                  autoFocus
                required
              />
              </label>

              <label className="block text-xs font-bold text-slate-300">
                Nama divisi
                <input
                  type="text"
                  placeholder="Contoh: Divisi Transmisi"
                  value={newDept}
                  onChange={(event) => {
                    setNewDept(event.target.value);
                    setRegistrationError('');
                  }}
                  className="mt-1.5"
                  minLength={2}
                  maxLength={100}
                  autoComplete="organization"
                  required
                />
              </label>

              <fieldset>
                <legend className="mb-1.5 text-xs font-bold text-slate-300">Level permainan</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['A', 'B'] as SkillLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewLevel(level)}
                      aria-pressed={newLevel === level}
                      className={`rounded-xl border px-3 py-3 text-left transition ${newLevel === level ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-white/10 bg-slate-900/70 text-slate-400 hover:border-white/20'}`}
                    >
                      <strong className="block text-sm">Level {level}</strong>
                      <span className="text-[10px]">{level === 'A' ? 'Mahir / kompetitif' : 'Pemula / menengah'}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 text-xs font-bold text-slate-300">Kategori peserta</legend>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'pria' as Gender, label: 'Putra' },
                    { value: 'wanita' as Gender, label: 'Putri' },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewGender(option.value)}
                      aria-pressed={newGender === option.value}
                      className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${newGender === option.value ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-slate-900/70 text-slate-400 hover:border-white/20'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {registrationError ? (
              <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{registrationError}</p>
            ) : null}

            <div className="flex items-center gap-2 border-t border-white/10 pt-4">
              <button type="button" onClick={closeJoinLayer} disabled={isRegistering} className="btn-action-secondary flex-1 justify-center text-xs disabled:opacity-50">
                Batal
              </button>
              <button type="submit" disabled={isRegistering} className="btn-action-primary flex-[1.5] justify-center text-xs disabled:opacity-50">
                {isRegistering ? 'Mendaftarkan...' : 'Gabung Liga'}
              </button>
            </div>

            <p className="text-center text-[10px] leading-relaxed text-slate-500">
              Data digunakan untuk daftar peserta, matchmaking, dan klasemen liga.
            </p>
          </form>
        </div>
      ) : null}
    </div>
  );
};
