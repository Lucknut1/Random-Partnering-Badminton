import React, { useState } from 'react';
import { Player, CheckInRecord, League, Match, Gender, SkillLevel } from '../types';
import { Users, Search, Plus, UserCheck, Check, RefreshCw, Clock } from 'lucide-react';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { getLocalDate } from '../services/dateService';

interface PlayersViewProps {
  players: Player[];
  checkIns: CheckInRecord[];
  activeLeague: League;
  matches: Match[];
  onAddPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void;
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
  onAddPlayer,
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

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddPlayer({
      name: newName.trim(),
      gender: newGender,
      level: newLevel,
      department: newDept.trim() || 'Umum',
      leagueId: activeLeague.id,
    });

    setNewName('');
    setNewDept('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-['Outfit']">
            <Users className="text-emerald-400" size={22} />
            <span>Players & Check-In</span>
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
            onClick={() => setShowAddModal(true)}
            className="btn-action-primary text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Tambah</span>
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

      {/* Add Player Modal */}
      {canManage && showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePlayer}
            className="clean-card max-w-sm w-full p-5 space-y-4 border border-white/20 bg-[#0e1420]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white">Tambah Pemain Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Nama Pemain:</label>
              <input
                type="text"
                placeholder="Nama Lengkap..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs py-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Gender:</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as Gender)}
                  className="text-xs py-1.5"
                >
                  <option value="pria">Pria</option>
                  <option value="wanita">Wanita</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Level:</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as SkillLevel)}
                  className="text-xs py-1.5"
                >
                  <option value="A">Level A (Tinggi)</option>
                  <option value="B">Level B (Menengah)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Departemen / Divisi:</label>
              <input
                type="text"
                placeholder="Contoh: Operasi / Keuangan"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-action-secondary text-xs"
              >
                Batal
              </button>
              <button type="submit" className="btn-action-primary text-xs">
                Simpan Pemain
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
