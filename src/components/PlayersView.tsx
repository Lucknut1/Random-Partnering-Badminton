import React, { useState } from 'react';
import { Player, CheckInRecord, League, Match, Gender, SkillLevel } from '../types';
import { Users, Search, Plus, UserCheck, Check, RefreshCw, Clock, X, Trophy, Shield, UserPlus, Flame } from 'lucide-react';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { getLocalDate } from '../services/dateService';

interface PlayersViewProps {
  players: Player[];
  checkIns: CheckInRecord[];
  leagues: League[];
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
  leagues,
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
  const [registrationLeagueId, setRegistrationLeagueId] = useState(activeLeague.id);
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
    setRegistrationLeagueId(activeLeague.id);
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
      setRegistrationError('Nama lengkap atlet minimal 3 karakter.');
      return;
    }
    if (newDept.trim().length < 2) {
      setRegistrationError('Nama divisi atau departemen minimal 2 karakter.');
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
        leagueId: registrationLeagueId,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* BWF ATHLETE REGISTRY HEADER */}
      <div className="clean-card p-5 bg-[#0d121c] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
              BWF ATHLETE REGISTRY
            </span>
            <span className="text-xs text-slate-400 font-semibold">{activeLeague.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] flex items-center gap-2">
            <Users className="text-rose-500" size={22} />
            <span>Peserta & Check-In Kiosk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {todayCheckIns.length} dari {leaguePlayers.length} atlet hadir hari ini ({Math.round((todayCheckIns.length / (leaguePlayers.length || 1)) * 100)}%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => onBulkCheckIn(leaguePlayers.map((p) => p.id))}
              className="btn-action-secondary text-xs py-2 px-3 hidden sm:inline-flex items-center gap-1.5"
              title="Check-In Semua Pemain"
            >
              <Check size={14} className="text-emerald-400" />
              <span>Check-In Semua</span>
            </button>
          )}

          <button
            onClick={openJoinLayer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 transition border-none cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Daftar Atlet</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="clean-card p-3 sm:p-4 bg-[#0a0e18] border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Cari atlet atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg w-full bg-[#101524] border-white/10 focus:border-rose-500 text-slate-200"
          />
        </div>

        {/* Gender Toggle Tabs */}
        <div className="flex items-center gap-1 bg-[#101524] p-1 rounded-lg border border-white/5 text-xs">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-3 py-1 rounded text-xs font-extrabold transition ${
              genderFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setGenderFilter('pria')}
            className={`px-3 py-1 rounded text-xs font-extrabold transition ${
              genderFilter === 'pria' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Putra (MS/MD)
          </button>
          <button
            onClick={() => setGenderFilter('wanita')}
            className={`px-3 py-1 rounded text-xs font-extrabold transition ${
              genderFilter === 'wanita' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Putri (WS/WD)
          </button>
        </div>
      </div>

      {/* ATHLETES LIST (BWF PLAYER CARDS) */}
      <div className="clean-card bg-[#0d121c] border-white/10 divide-y divide-white/5 overflow-hidden shadow-xl">
        {filteredPlayers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Tidak ada atlet ditemukan pada kategori ini.
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
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${
                      player.gender === 'pria'
                        ? 'bg-rose-600/15 text-rose-400 border border-rose-500/30'
                        : 'bg-pink-600/15 text-pink-400 border border-pink-500/30'
                    }`}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>{player.name}</span>
                      <span className={`badge-lvl-${player.level.toLowerCase()} text-[10px]`}>
                        Level {player.level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{player.department}</span>
                      <span className="text-slate-600">•</span>
                      <span className="capitalize">{player.gender === 'pria' ? 'Putra' : 'Putri'}</span>
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
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-500/25 transition"
                          title={`Sisa waktu ${sessionTime.remainingMinutes} menit`}
                        >
                          <RefreshCw size={13} />
                          <span>Ronde {checkIn.round + 1}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveCheckIn(checkIn.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition"
                        title="Klik untuk membatalkan check-in"
                      >
                        {hasPlayed && !sessionTime.hasTimeToPlayMore ? <Clock size={13} /> : <UserCheck size={13} />}
                        <span>{hasPlayed ? `${Math.max(checkIn.matchesPlayedToday, completedToday)}x Main` : 'Hadir'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddCheckIn(player.id, 1)}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 border-none cursor-pointer transition"
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

      {/* BWF ATHLETE ENTRY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md" role="presentation">
          <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-4">
            <form
              onSubmit={handleCreatePlayer}
              className="clean-card max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto border border-rose-500/30 bg-[#0b101c] p-5 sm:p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    BWF ATHLETE ENTRY
                  </span>
                  <h2 className="text-xl font-black text-white font-['Outfit']">Pendaftaran Atlet</h2>
                  <p className="mt-1 text-xs text-slate-400">Daftarkan pemain ke dalam sistem turnamen liga.</p>
                </div>
                <button
                  type="button"
                  onClick={closeJoinLayer}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {registrationError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {registrationError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap Atlet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Anthony Ginting"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg bg-[#101524] border-white/10 focus:border-rose-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Divisi / Departemen *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tim IT / Operasional"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg bg-[#101524] border-white/10 focus:border-rose-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Kategori Gender</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as Gender)}
                      className="w-full text-xs py-2 px-3 rounded-lg bg-[#101524] border-white/10 text-white font-bold"
                    >
                      <option value="pria">Putra (MS/MD)</option>
                      <option value="wanita">Putri (WS/WD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Level Permainan</label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value as SkillLevel)}
                      className="w-full text-xs py-2 px-3 rounded-lg bg-[#101524] border-white/10 text-white font-bold"
                    >
                      <option value="A">Level A (Mahir / Elite)</option>
                      <option value="B">Level B (Intermediate)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeJoinLayer}
                  className="btn-action-secondary text-xs py-2 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition border-none cursor-pointer disabled:opacity-50"
                >
                  {isRegistering ? 'Mendaftarkan...' : 'Simpan Profil Atlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersView;
