import React, { useState } from 'react';
import { Player, Match, League, CheckInRecord, Gender } from '../types';
import { standingsEngine } from '../services/standingsEngine';
import { getLocalDate } from '../services/dateService';
import { 
  Plus, 
  Trophy, 
  Activity, 
  Users, 
  ChevronRight, 
  Flame, 
  ArrowRight,
  ShieldCheck,
  Clock,
  TrendingUp
} from 'lucide-react';

interface DashboardViewProps {
  players: Player[];
  matches: Match[];
  activeLeague: League;
  checkIns: CheckInRecord[];
  onOpenRecordModal: () => void;
  onNavigateTab: (tab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  players,
  matches,
  activeLeague,
  checkIns,
  onOpenRecordModal,
  onNavigateTab,
}) => {
  const [topGender, setTopGender] = useState<Gender>('pria');

  const checkedInPlayerIds = new Set(
    checkIns
      .filter((record) => record.leagueId === activeLeague.id)
      .map((record) => record.playerId)
  );

  // Calculate Standings for Top Players
  const standings = standingsEngine.calculateStandings(players, matches, {
    leagueId: activeLeague.id,
    seasonId: activeLeague.activeSeasonId,
    gender: topGender,
    level: 'ALL',
    eligiblePlayerIds: checkedInPlayerIds,
  });

  const topPlayers = standings.slice(0, 5);

  // Recent Matches (Last 4 completed)
  const recentMatches = matches
    .filter((m) => m.status === 'COMPLETED' && m.leagueId === activeLeague.id)
    .sort((a, b) => {
      const d = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (d !== 0) return d;
      return (b.completedAt || '').localeCompare(a.completedAt || '');
    })
    .slice(0, 4);

  // Statistics calculation
  const totalMatchesCount = matches.filter((m) => m.leagueId === activeLeague.id && m.status === 'COMPLETED').length;
  const leaguePlayers = players.filter((p) => p.leagueId === activeLeague.id || p.leagueId === 'all');
  const today = getLocalDate();
  const todayCheckedInCount = checkIns.filter((c) => c.date === today && c.leagueId === activeLeague.id).length;

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  return (
    <div className="max-w-2xl mx-auto space-y-7 pb-12">
      {/* 1. Header & Title */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-2">
          <span>{activeLeague.name}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
          BADMINTON MATCH TRACKER
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Sistem Klasemen Perorangan • Menang = 3 Poin
        </p>
      </div>

      {/* 2. Hero Primary CTA: [ Record Match ] */}
      <div>
        <button
          onClick={onOpenRecordModal}
          className="btn-record-hero"
        >
          <Plus size={20} className="stroke-[3]" />
          <span>Record Match</span>
        </button>
      </div>

      {/* Subtle Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* 3. Top Players Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <h2 className="text-base font-extrabold text-white">Top Players</h2>
          </div>

          {/* Gender Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#131a26] p-0.5 rounded-lg border border-white/5 text-xs">
            <button
              onClick={() => setTopGender('pria')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                topGender === 'pria'
                  ? 'bg-blue-600/90 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Putra
            </button>
            <button
              onClick={() => setTopGender('wanita')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                topGender === 'wanita'
                  ? 'bg-pink-600/90 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Putri
            </button>
          </div>
        </div>

        {/* Top Players Clean List */}
        <div className="clean-card divide-y divide-white/5 overflow-hidden">
          {topPlayers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Belum ada data pertandingan untuk kategori ini.
            </div>
          ) : (
            topPlayers.map((row, idx) => (
              <div
                key={row.player.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`pos-circle ${
                      idx === 0
                        ? 'pos-1'
                        : idx === 1
                        ? 'pos-2'
                        : idx === 2
                        ? 'pos-3'
                        : 'pos-other'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>{row.player.name}</span>
                      <span className={`badge-lvl-${row.player.level.toLowerCase()}`}>
                        Lvl {row.player.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {row.player.department} • {row.won}W - {row.lost}L ({row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-base text-emerald-400 mono-num">
                    {row.points} <span className="text-xs font-normal text-slate-400">pts</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Full Leaderboard Link */}
        <div className="text-right pt-1">
          <button
            onClick={() => onNavigateTab('ranking')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <span>Lihat Seluruh Klasemen</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* 4. Recent Matches Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Recent Matches</h2>
          </div>
          <button
            onClick={() => onNavigateTab('matches')}
            className="text-xs text-slate-400 hover:text-white font-semibold bg-transparent border-none cursor-pointer"
          >
            Semua Hasil
          </button>
        </div>

        {recentMatches.length === 0 ? (
          <div className="clean-card p-6 text-center text-xs text-slate-500">
            Belum ada pertandingan selesai. Klik [ Record Match ] untuk mencatat hasil pertama!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentMatches.map((match) => {
              const p1A = getPlayer(match.teamA.player1Id);
              const p2A = getPlayer(match.teamA.player2Id);
              const p1B = getPlayer(match.teamB.player1Id);
              const p2B = getPlayer(match.teamB.player2Id);

              const teamAWon = match.winnerTeam === 'teamA' || match.teamA.score > match.teamB.score;
              const teamBWon = match.winnerTeam === 'teamB' || match.teamB.score > match.teamA.score;

              return (
                <div
                  key={match.id}
                  className="clean-card p-3.5 space-y-2 border border-white/5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-emerald-400">Lap. {match.courtNumber}</span>
                    <span className="badge-sport-format">
                      {match.format === 'RACE_42' ? 'Race 42' : 'BWF 21'}
                    </span>
                  </div>

                  {/* Team A */}
                  <div className={`flex items-center justify-between text-xs p-1.5 rounded ${
                    teamAWon ? 'bg-emerald-500/10 text-white font-bold' : 'text-slate-300'
                  }`}>
                    <span className="truncate pr-2">
                      {p1A?.name || 'P1'} & {p2A?.name || 'P2'}
                    </span>
                    <span className="mono-num text-sm font-extrabold text-white">
                      {match.teamA.score}
                    </span>
                  </div>

                  {/* VS separator */}
                  <div className="text-center text-[10px] text-slate-600 font-bold -my-1">vs</div>

                  {/* Team B */}
                  <div className={`flex items-center justify-between text-xs p-1.5 rounded ${
                    teamBWon ? 'bg-emerald-500/10 text-white font-bold' : 'text-slate-300'
                  }`}>
                    <span className="truncate pr-2">
                      {p1B?.name || 'P1'} & {p2B?.name || 'P2'}
                    </span>
                    <span className="mono-num text-sm font-extrabold text-white">
                      {match.teamB.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtle Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* 5. Statistics Section */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-white">Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="clean-card p-3.5 text-center">
            <span className="text-xs text-slate-400 block mb-1">Total Matches</span>
            <span className="text-2xl font-black text-white font-['Outfit'] mono-num">
              {totalMatchesCount}
            </span>
          </div>

          <div className="clean-card p-3.5 text-center">
            <span className="text-xs text-slate-400 block mb-1">Total Players</span>
            <span className="text-2xl font-black text-white font-['Outfit'] mono-num">
              {leaguePlayers.length}
            </span>
          </div>

          <div className="clean-card p-3.5 text-center col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 block mb-1">Check-In Hari Ini</span>
            <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mono-num">
              {todayCheckedInCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
