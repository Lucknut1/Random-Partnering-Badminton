import React, { useState } from 'react';
import { Player, Match, League, CheckInRecord, Gender } from '../types';
import { standingsEngine } from '../services/standingsEngine';
import { formatLocalDateLong, getLocalDate } from '../services/dateService';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Trophy,
  Users,
  Shield,
  ChevronRight,
  Sparkles
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
  const today = getLocalDate();
  const leaguePlayers = players.filter(
    (player) => player.leagueId === activeLeague.id || player.leagueId === 'all'
  );
  const todayCheckIns = checkIns.filter(
    (record) => record.date === today && record.leagueId === activeLeague.id
  );
  const checkedInPlayerIds = new Set(
    checkIns
      .filter((record) => record.leagueId === activeLeague.id)
      .map((record) => record.playerId)
  );
  const standings = standingsEngine.calculateStandings(players, matches, {
    leagueId: activeLeague.id,
    seasonId: activeLeague.activeSeasonId,
    gender: topGender,
    level: 'ALL',
    eligiblePlayerIds: checkedInPlayerIds,
  });
  const topPlayers = standings.slice(0, 5);
  const leagueMatches = matches.filter((match) => match.leagueId === activeLeague.id);
  const completedMatches = leagueMatches.filter((match) => match.status === 'COMPLETED');
  const activeMatches = leagueMatches.filter((match) => match.status === 'IN_PROGRESS');
  const availableCourts = Math.max(0, activeLeague.courtsCount - activeMatches.length);
  const waitingPlayers = Math.max(0, todayCheckIns.length - (activeMatches.length * 4));

  const recentMatches = [...completedMatches]
    .sort((a, b) => {
      const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDifference || (b.completedAt || '').localeCompare(a.completedAt || '');
    })
    .slice(0, 4);

  const getPlayerName = (id: string) => players.find((player) => player.id === id)?.name || 'Peserta';

  return (
    <div className="space-y-5 pb-8 max-w-7xl mx-auto">
      
      {/* 1. HORIZONTAL STATUS STRIP (YONEX MECHANICAL SPEC) */}
      <section className="clean-card p-4 sm:p-5 bg-white border border-[#CBD5E1] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
                PUSAT KOMPETISI LIGA
              </span>
              <span className="text-xs text-slate-500 font-semibold">{formatLocalDateLong()}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B50A1] font-['Outfit'] tracking-wider uppercase">
              {activeLeague.name}
            </h1>
            <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 font-medium">
              <span><MapPin size={13} className="inline text-[#0B50A1]" /> {activeLeague.venue}</span>
              <span>•</span>
              <span><Clock3 size={13} className="inline text-[#0B50A1]" /> {activeLeague.startTime} - {activeLeague.endTime} WIB</span>
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
            <div className="p-2.5 sm:p-3 bg-[#F0FAF2] border border-[#A3E3B1] rounded-xs text-center min-w-[90px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#157327] block">
                LAGA AKTIF
              </span>
              <span className="font-mono font-black text-xl sm:text-2xl text-[#1D9533]">
                {activeMatches.length}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs text-center min-w-[90px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                LAP. KOSONG
              </span>
              <span className="font-mono font-black text-xl sm:text-2xl text-slate-800">
                {availableCourts}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 bg-[#EBF3FC] border border-[#BCD8F8] rounded-xs text-center min-w-[90px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B50A1] block">
                MENUNGGU
              </span>
              <span className="font-mono font-black text-xl sm:text-2xl text-[#0B50A1]">
                {waitingPlayers}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-[#E2E8F0]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenRecordModal}
              className="btn-yonex-action"
            >
              <Plus size={15} strokeWidth={3} />
              <span>CATAT SKOR PERTANDINGAN</span>
            </button>

            <button
              onClick={() => onNavigateTab('players')}
              className="btn-yonex-outline"
            >
              <Users size={15} className="text-[#0B50A1]" />
              <span>CHECK-IN ({todayCheckIns.length}/{leaguePlayers.length})</span>
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('ranking')}
            className="btn-yonex-outline text-[#0B50A1] border-[#0B50A1]"
          >
            <Trophy size={15} />
            <span>KLASEMEN LENGKAP</span>
          </button>
        </div>
      </section>

      {/* 2. DASHBOARD MAIN GRID: TOP 5 LEADERBOARD & RECENT MATCHES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT COLUMN: TOP 5 LEADERBOARD (YONEX 3-TIER COLOR SYSTEM) */}
        <section className="clean-card p-4 sm:p-5 bg-white border border-[#CBD5E1] space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#EBF3FC] text-[#0B50A1] flex items-center justify-center rounded-xs font-black text-xs">
                <Trophy size={15} />
              </div>
              <div>
                <h3 className="font-black text-[#0B50A1] text-xs sm:text-sm font-['Outfit'] uppercase tracking-wider">
                  TOP 5 LEADERBOARD
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Peringkat klasemen sementara liga</p>
              </div>
            </div>

            {/* Gender Toggle */}
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-xs border border-[#E2E8F0]">
              <button
                onClick={() => setTopGender('pria')}
                className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider transition ${
                  topGender === 'pria' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
                }`}
              >
                PUTRA
              </button>
              <button
                onClick={() => setTopGender('wanita')}
                className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider transition ${
                  topGender === 'wanita' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
                }`}
              >
                PUTRI
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {topPlayers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 font-medium">
                Belum ada perolehan poin pada kategori ini.
              </div>
            ) : (
              topPlayers.map((row, index) => {
                const isRank1 = index === 0;
                const isRank2 = index === 1;
                const isRank3 = index === 2;

                return (
                  <div
                    key={row.player.id}
                    className={`flex items-center justify-between p-2.5 rounded-xs border transition ${
                      isRank1
                        ? 'yonex-row-rank-1 border-[#FCD34D]'
                        : isRank2
                        ? 'yonex-row-rank-2 border-[#BCD8F8]'
                        : isRank3
                        ? 'yonex-row-rank-3 border-[#A3E3B1]'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rank-badge-box ${
                          isRank1
                            ? 'rank-box-gold'
                            : isRank2
                            ? 'rank-box-blue'
                            : isRank3
                            ? 'rank-box-green'
                            : 'rank-box-standard'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div className="font-extrabold text-[#0F172A] text-xs uppercase tracking-tight flex items-center gap-1.5">
                          <span>{row.player.name}</span>
                          {isRank1 && <Trophy size={13} className="text-[#D4AF37] inline" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          {row.player.department} · Level {row.player.level}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="font-mono font-black text-sm text-[#0B50A1] block">
                          {row.points} PTS
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {row.won}W - {row.lost}L ({row.winRate}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => onNavigateTab('ranking')}
            className="w-full py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0B50A1] text-xs font-black uppercase tracking-wider rounded-xs border border-[#CBD5E1] flex items-center justify-center gap-1.5 transition"
          >
            <span>LIHAT KLASEMEN LENGKAP</span>
            <ChevronRight size={14} />
          </button>
        </section>

        {/* RIGHT COLUMN: RECENT MATCHES (HIGH CONTRAST OUTDOOR READABLE) */}
        <section className="clean-card p-4 sm:p-5 bg-white border border-[#CBD5E1] space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#EBF3FC] text-[#0B50A1] flex items-center justify-center rounded-xs font-black text-xs">
                <Activity size={15} />
              </div>
              <div>
                <h3 className="font-black text-[#0B50A1] text-xs sm:text-sm font-['Outfit'] uppercase tracking-wider">
                  HASIL LAGA TERAKHIR
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Rekap pertandingan yang baru selesai</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('matches')}
              className="text-xs font-bold text-[#0B50A1] hover:underline flex items-center gap-1 uppercase"
            >
              <span>SEMUA LAGA</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {recentMatches.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 font-medium">
                Belum ada pertandingan selesai pada sesi ini.
              </div>
            ) : (
              recentMatches.map((m) => {
                const teamAWon = m.winnerTeam === 'teamA' || m.teamA.score > m.teamB.score;
                const teamBWon = m.winnerTeam === 'teamB' || m.teamB.score > m.teamA.score;

                return (
                  <div
                    key={m.id}
                    className="p-3 bg-[#F8FAFC] rounded-xs border border-[#CBD5E1] space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase border-b border-[#E2E8F0] pb-1">
                      <span className="text-[#0B50A1]">LAPANGAN {m.courtNumber}</span>
                      <span>{m.format === 'RACE_42' ? 'Race 42' : 'Standar 21'} • Selesai {m.completedAt || 'Hari Ini'}</span>
                    </div>

                    <div className="space-y-1">
                      {/* Team A */}
                      <div className={`flex items-center justify-between text-xs px-2 py-1 rounded-xs ${
                        teamAWon ? 'bg-[#EDF9F0] text-[#157327] font-black border border-[#A3E3B1]' : 'text-slate-700'
                      }`}>
                        <span className="truncate max-w-[220px]">
                          {getPlayerName(m.teamA.player1Id)} & {getPlayerName(m.teamA.player2Id)}
                        </span>
                        <span className="font-mono font-black text-sm">{m.teamA.score}</span>
                      </div>

                      {/* Team B */}
                      <div className={`flex items-center justify-between text-xs px-2 py-1 rounded-xs ${
                        teamBWon ? 'bg-[#EDF9F0] text-[#157327] font-black border border-[#A3E3B1]' : 'text-slate-700'
                      }`}>
                        <span className="truncate max-w-[220px]">
                          {getPlayerName(m.teamB.player1Id)} & {getPlayerName(m.teamB.player2Id)}
                        </span>
                        <span className="font-mono font-black text-sm">{m.teamB.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default DashboardView;
