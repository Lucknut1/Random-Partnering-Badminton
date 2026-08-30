import React, { useState } from 'react';
import { Player, CheckInRecord, League, Match, Gender, SkillLevel } from '../types';
import { Users, Search, Plus, UserCheck, Check, RefreshCw, Clock, X, Trophy, UserPlus } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* 1. ATHLETE REGISTRY HEADER */}
      <div className="clean-card p-4 sm:p-5 bg-white border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
              DAFTAR ATLET LIGA
            </span>
            <span className="text-xs text-slate-500 font-semibold">{activeLeague.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B50A1] font-['Outfit'] tracking-wider uppercase flex items-center gap-2">
            <Users className="text-[#0B50A1]" size={22} />
            <span>PESERTA & CHECK-IN KIOSK</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {todayCheckIns.length} dari {leaguePlayers.length} atlet hadir hari ini ({Math.round((todayCheckIns.length / (leaguePlayers.length || 1)) * 100)}%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => onBulkCheckIn(leaguePlayers.map((p) => p.id))}
              className="btn-yonex-outline text-xs py-2 px-3 hidden sm:inline-flex items-center gap-1.5 uppercase"
              title="Check-In Semua Pemain"
            >
              <Check size={14} className="text-[#1D9533]" />
              <span>Check-In Semua</span>
            </button>
          )}

          <button
            onClick={openJoinLayer}
            className="btn-yonex-action"
          >
            <UserPlus size={14} />
            <span>DAFTAR ATLET</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="clean-card p-3 sm:p-4 bg-white border border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Cari atlet atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xs w-full bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0B50A1]"
          />
        </div>

        {/* Gender Toggle Tabs */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xs border border-[#CBD5E1] text-xs">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-3 py-1 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              genderFilter === 'all' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
            }`}
          >
            SEMUA
          </button>
          <button
            onClick={() => setGenderFilter('pria')}
            className={`px-3 py-1 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              genderFilter === 'pria' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
            }`}
          >
            PUTRA
          </button>
          <button
            onClick={() => setGenderFilter('wanita')}
            className={`px-3 py-1 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              genderFilter === 'wanita' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
            }`}
          >
            PUTRI
          </button>
        </div>
      </div>

      {/* 3. ATHLETES LIST (YONEX MECHANICAL ROSTER CARDS) */}
      <div className="clean-card bg-white border border-[#CBD5E1] divide-y divide-[#E2E8F0] overflow-hidden shadow-xs">
        {filteredPlayers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
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
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] transition"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-9 h-9 rounded-xs flex items-center justify-center font-black text-xs uppercase ${
                      player.gender === 'pria'
                        ? 'bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]'
                        : 'bg-[#EDF9F0] text-[#157327] border border-[#A3E3B1]'
                    }`}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-[#0F172A] text-xs sm:text-sm flex items-center gap-2 uppercase tracking-tight">
                      <span>{player.name}</span>
                      <span className={`badge-lvl-${player.level.toLowerCase()} text-[10px]`}>
                        LVL {player.level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                      <span>{player.department}</span>
                      <span className="text-slate-400">•</span>
                      <span className="capitalize">{player.gender === 'pria' ? 'Ganda Putra' : 'Ganda Putri'}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Tap Check-In Button (Yonex Green Solid) */}
                <div>
                  {isCheckedIn ? (
                    <div className="flex items-center gap-1.5">
                      {canRecheck && (
                        <button
                          onClick={() => onAddCheckIn(player.id, checkIn.round + 1)}
                          className="px-2.5 py-1.5 rounded-xs bg-[#FEF3C7] border border-[#FCD34D] text-[#B45309] text-xs font-black uppercase flex items-center gap-1 hover:bg-[#FDE68A] transition"
                          title={`Sisa waktu ${sessionTime.remainingMinutes} menit`}
                        >
                          <RefreshCw size={13} />
                          <span>Ronde {checkIn.round + 1}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveCheckIn(checkIn.id)}
                        className="px-3 py-1.5 rounded-xs bg-[#EDF9F0] border border-[#A3E3B1] text-[#157327] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
                        title="Klik untuk membatalkan check-in"
                      >
                        {hasPlayed && !sessionTime.hasTimeToPlayMore ? <Clock size={13} /> : <UserCheck size={13} />}
                        <span>{hasPlayed ? `${Math.max(checkIn.matchesPlayedToday, completedToday)}x Main` : 'Hadir'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddCheckIn(player.id, 1)}
                      className="btn-yonex-action text-xs py-1.5 px-3.5"
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

      {/* 4. ATHLETE ENTRY MODAL (CLEAN LIGHT MODAL) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs" role="presentation">
          <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-4">
            <form
              onSubmit={handleCreatePlayer}
              className="clean-card max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto border border-[#CBD5E1] bg-white p-5 sm:p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0B50A1]">
                    PENDAFTARAN ATLET RESMI
                  </span>
                  <h2 className="text-xl font-black text-[#0B50A1] font-['Outfit'] uppercase">Pendaftaran Atlet</h2>
                  <p className="mt-1 text-xs text-slate-600 font-medium">Daftarkan pemain ke dalam sistem turnamen liga.</p>
                </div>
                <button
                  type="button"
                  onClick={closeJoinLayer}
                  className="rounded-xs p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {registrationError && (
                <div className="p-3 rounded-xs bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                  {registrationError}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Atlet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Anthony Ginting"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full py-2 px-3 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Divisi / Departemen *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tim IT / Operasional"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full py-2 px-3 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Gender</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as Gender)}
                      className="w-full py-2 px-3 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                    >
                      <option value="pria">Putra (Ganda Putra)</option>
                      <option value="wanita">Putri (Ganda Putri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Level Permainan</label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value as SkillLevel)}
                      className="w-full py-2 px-3 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                    >
                      <option value="A">Level A (Elite)</option>
                      <option value="B">Level B (Intermediate)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeJoinLayer}
                  className="btn-yonex-outline text-xs py-2 px-4 uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="btn-yonex-action disabled:opacity-50"
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
