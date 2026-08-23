import React, { useState } from 'react';
import { Player, CheckInRecord, League, Match } from '../types';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { getLocalDate } from '../services/dateService';
import { 
  UserCheck, 
  UserX, 
  Search, 
  PlusCircle, 
  RotateCw, 
  Clock, 
  ShieldCheck, 
  Users, 
  AlertTriangle,
  Flame,
  Check,
  Zap
} from 'lucide-react';

interface CheckInKioskProps {
  players: Player[];
  checkIns: CheckInRecord[];
  activeLeague: League;
  matches: Match[];
  onAddCheckIn: (playerId: string, round?: number) => void;
  onRemoveCheckIn: (checkInId: string) => void;
  onBulkCheckIn: (playerIds: string[]) => void;
  onResetTodayCheckIns: () => void;
}

export const CheckInKiosk: React.FC<CheckInKioskProps> = ({
  players,
  checkIns,
  activeLeague,
  matches,
  onAddCheckIn,
  onRemoveCheckIn,
  onBulkCheckIn,
  onResetTodayCheckIns,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDate()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'pria' | 'wanita'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'A' | 'B'>('all');

  // Time remaining calculator
  const timeInfo = matchmakingEngine.calculateSessionTimeRemaining(activeLeague);

  // League players
  const leaguePlayers = players.filter(
    (p) => p.leagueId === activeLeague.id || p.leagueId === 'all'
  );

  // Today's check-ins for this league
  const todayCheckIns = checkIns.filter(
    (c) => c.date === selectedDate && c.leagueId === activeLeague.id
  );

  // Set of checked-in player IDs
  const checkedInPlayerMap = new Map<string, CheckInRecord>();
  todayCheckIns.forEach((c) => checkedInPlayerMap.set(c.playerId, c));

  // Determine player status today
  const getPlayerStatus = (playerId: string) => {
    const checkIn = checkedInPlayerMap.get(playerId);
    if (!checkIn) return { status: 'NOT_CHECKED_IN', label: 'Belum Check-In', round: 0 };

    // Check if player is currently playing in an active match
    const isPlaying = matches.some(
      (m) =>
        m.date === selectedDate &&
        m.leagueId === activeLeague.id &&
        (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED') &&
        (m.teamA.player1Id === playerId ||
          m.teamA.player2Id === playerId ||
          m.teamB.player1Id === playerId ||
          m.teamB.player2Id === playerId)
    );

    if (isPlaying) {
      return { status: 'PLAYING', label: 'Sedang Main', round: checkIn.round };
    }

    // Count completed matches today
    const completedMatches = matches.filter(
      (m) =>
        m.date === selectedDate &&
        m.leagueId === activeLeague.id &&
        m.status === 'COMPLETED' &&
        (m.teamA.player1Id === playerId ||
          m.teamA.player2Id === playerId ||
          m.teamB.player1Id === playerId ||
          m.teamB.player2Id === playerId)
    ).length;

    if (completedMatches === 0) {
      return { status: 'WAITING_1ST', label: 'Belum Main (Prioritas 1x Main)', round: checkIn.round };
    } else if (checkIn.round >= 2) {
      return { status: 'READY_ROUND_2', label: `Cek-In Ulang (Ronde ${checkIn.round})`, round: checkIn.round };
    } else {
      return { status: 'PLAYED_1X', label: 'Sudah Main 1x (Selesai)', round: checkIn.round, count: completedMatches };
    }
  };

  // Filtered master list
  const filteredPlayers = leaguePlayers.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || player.gender === genderFilter;
    const matchesLevel = levelFilter === 'all' || player.level === levelFilter;
    return matchesSearch && matchesGender && matchesLevel;
  });

  // Check-In stats
  const totalCheckedIn = todayCheckIns.length;
  const menCheckedIn = todayCheckIns.filter((c) => {
    const p = players.find((pl) => pl.id === c.playerId);
    return p?.gender === 'pria';
  });
  const womenCheckedIn = todayCheckIns.filter((c) => {
    const p = players.find((pl) => pl.id === c.playerId);
    return p?.gender === 'wanita';
  });

  const menA = menCheckedIn.filter((c) => players.find((pl) => pl.id === c.playerId)?.level === 'A').length;
  const menB = menCheckedIn.filter((c) => players.find((pl) => pl.id === c.playerId)?.level === 'B').length;
  const womenA = womenCheckedIn.filter((c) => players.find((pl) => pl.id === c.playerId)?.level === 'A').length;
  const womenB = womenCheckedIn.filter((c) => players.find((pl) => pl.id === c.playerId)?.level === 'B').length;

  return (
    <div className="space-y-6">
      {/* Header & Date / Session controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="text-emerald-400" size={26} />
            <span>Kios Check-In Sesi Pertandingan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Peserta wajib check-in agar masuk antrean matchmaking dan klasemen sesi hari ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-400 font-medium">Tanggal Sesi:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-bold p-0 border-none w-auto focus:ring-0"
            />
          </div>

          <button
            onClick={() => onBulkCheckIn(leaguePlayers.map((p) => p.id))}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Check-in semua pemain liga"
          >
            <Check size={14} className="text-emerald-400" />
            <span>Check-In Semua</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Yakin ingin mereset seluruh data check-in sesi hari ini?')) {
                onResetTodayCheckIns();
              }
            }}
            className="btn btn-danger btn-sm flex items-center gap-1.5"
            title="Reset check-in"
          >
            <RotateCw size={14} />
            <span>Reset Check-In</span>
          </button>
        </div>
      </div>

      {/* Summary Cards: Quota & Guarantee 1x Play */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Check-in */}
        <div className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Check-In</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit']">
            {totalCheckedIn} <span className="text-xs font-normal text-slate-400">/ {leaguePlayers.length} Pemain</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <ShieldCheck size={12} /> Jaminan Min. 1x Main
          </div>
        </div>

        {/* Pria Check-In (A / B) */}
        <div className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Putra (Men)</span>
            <span className="badge-gender-m font-bold">PUTRA</span>
          </div>
          <div className="text-2xl font-black text-blue-400 font-['Outfit']">
            {menCheckedIn.length} <span className="text-xs font-normal text-slate-400">Pemain</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
            <span className="text-amber-300 font-bold">{menA} Level A</span>
            <span>•</span>
            <span className="text-sky-300 font-bold">{menB} Level B</span>
          </div>
        </div>

        {/* Wanita Check-In (A / B) */}
        <div className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Putri (Women)</span>
            <span className="badge-gender-w font-bold">PUTRI</span>
          </div>
          <div className="text-2xl font-black text-pink-400 font-['Outfit']">
            {womenCheckedIn.length} <span className="text-xs font-normal text-slate-400">Pemain</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
            <span className="text-amber-300 font-bold">{womenA} Level A</span>
            <span>•</span>
            <span className="text-sky-300 font-bold">{womenB} Level B</span>
          </div>
        </div>

        {/* Time Remaining & Re-Checkin Availability */}
        <div className={`glass-panel p-4 flex flex-col justify-between border-l-4 ${timeInfo.hasTimeToPlayMore ? 'border-l-amber-500' : 'border-l-red-500'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Sisa Waktu Sesi</span>
            <Clock size={16} className={timeInfo.hasTimeToPlayMore ? 'text-amber-400' : 'text-red-400'} />
          </div>
          <div className="text-2xl font-black text-amber-300 font-['JetBrains_Mono']">
            {timeInfo.remainingMinutes} <span className="text-xs font-normal text-slate-400">Menit</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1 font-medium">
            {timeInfo.hasTimeToPlayMore ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Zap size={12} /> Cek-in Ulang / Ronde 2 Dibuka
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Waktu Sesi Terbatas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama peserta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-lg"
          />
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-white/5">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Gender:</span>
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              genderFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setGenderFilter('pria')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              genderFilter === 'pria' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-400'
            }`}
          >
            Putra
          </button>
          <button
            onClick={() => setGenderFilter('wanita')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              genderFilter === 'wanita' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-pink-400'
            }`}
          >
            Putri
          </button>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-white/5">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Level:</span>
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              levelFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setLevelFilter('A')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              levelFilter === 'A' ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Level A
          </button>
          <button
            onClick={() => setLevelFilter('B')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              levelFilter === 'B' ? 'bg-sky-500/30 text-sky-300' : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            Level B
          </button>
        </div>
      </div>

      {/* Player Check-in Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => {
          const checkIn = checkedInPlayerMap.get(player.id);
          const isCheckedIn = !!checkIn;
          const statusInfo = getPlayerStatus(player.id);

          return (
            <div
              key={player.id}
              className={`p-4 rounded-xl border transition-all ${
                isCheckedIn
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-950/60 border-white/5 opacity-75 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
                      isCheckedIn
                        ? player.gender === 'pria'
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                          : 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                        : 'bg-slate-800 text-slate-500 border border-white/5'
                    }`}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <span>{player.name}</span>
                    </h4>
                    <p className="text-xs text-slate-400">{player.department}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`badge-level-${player.level.toLowerCase()}`}>
                    Level {player.level}
                  </span>
                  <span className={player.gender === 'pria' ? 'badge-gender-m' : 'badge-gender-w'}>
                    {player.gender === 'pria' ? 'Pria' : 'Wanita'}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {isCheckedIn ? (
                  <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-slate-300 font-semibold">{statusInfo.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Jam {checkIn?.checkInTime}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 px-3 py-1.5 rounded-lg border border-dashed border-white/10 text-xs text-slate-500 text-center font-medium">
                    Belum Check-In Hari Ini
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {!isCheckedIn ? (
                  <button
                    onClick={() => onAddCheckIn(player.id, 1)}
                    className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5 font-bold"
                  >
                    <UserCheck size={15} />
                    <span>Check-In Masuk</span>
                  </button>
                ) : (
                  <>
                    {/* Re-checkin button if player already played and session has time */}
                    {statusInfo.status === 'PLAYED_1X' && timeInfo.hasTimeToPlayMore && (
                      <button
                        onClick={() => onAddCheckIn(player.id, (checkIn?.round || 1) + 1)}
                        className="btn btn-gold btn-sm flex-1 flex items-center justify-center gap-1 text-xs"
                        title="Daftar untuk main ronde berikutnya"
                      >
                        <Zap size={13} />
                        <span>Cek-In Ulang (Ronde {(checkIn?.round || 1) + 1})</span>
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveCheckIn(checkIn.id)}
                      className="btn btn-secondary btn-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5"
                      title="Batalkan Check-In"
                    >
                      <UserX size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
