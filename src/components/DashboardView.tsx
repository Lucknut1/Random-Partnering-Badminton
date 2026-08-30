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
  Sparkles,
  Trophy,
  Users,
  Shield,
  Zap,
  Star,
  Award,
  ChevronRight,
  Flame
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
  const recentMatches = [...completedMatches]
    .sort((a, b) => {
      const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDifference || (b.completedAt || '').localeCompare(a.completedAt || '');
    })
    .slice(0, 4);

  const checkInProgress = leaguePlayers.length
    ? Math.min(100, Math.round((todayCheckIns.length / leaguePlayers.length) * 100))
    : 0;

  const getPlayerName = (id: string) => players.find((player) => player.id === id)?.name || 'Peserta';

  return (
    <div className="space-y-6 pb-8">
      {/* BWF TOURNAMENT HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121829] via-[#0e1424] to-[#0a0e1a] border border-rose-500/25 shadow-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-rose-500 via-amber-400 to-rose-600" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
          {/* Main Tournament Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-600/30">
                <Shield size={11} /> BWF TOURNAMENT HUB
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sesi Sedang Berjalan
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
              {activeLeague.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <CalendarDays size={14} className="text-rose-400" /> {formatLocalDateLong()}
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <MapPin size={14} className="text-rose-400" /> {activeLeague.venue}
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <Clock3 size={14} className="text-rose-400" /> {activeLeague.startTime} - {activeLeague.endTime} WIB
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Satu raket, banyak partner, satu klasemen resmi. Pantau jalannya turnamen, skor langsung per lapangan, dan peringkat pemain secara *real-time*.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenRecordModal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-xl shadow-rose-600/30 transition transform hover:-translate-y-0.5 border-none cursor-pointer"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Catat Skor Laga</span>
              </button>

              <button
                onClick={() => onNavigateTab('players')}
                className="btn-action-secondary text-xs py-3 px-4"
              >
                <Users size={16} />
                <span>Check-In Peserta</span>
              </button>

              <button
                onClick={() => onNavigateTab('ranking')}
                className="px-4 py-3 rounded-xl text-xs font-extrabold bg-[#161f33] text-amber-300 hover:bg-[#1c2740] border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Trophy size={15} />
                <span>Klasemen BWF</span>
              </button>
            </div>
          </div>

          {/* Right Column: Court & Session Widget */}
          <div className="bg-[#090d17]/90 border border-white/10 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">STATUS LAPANGAN</span>
                <h3 className="font-extrabold text-white text-sm">{activeLeague.courtsCount} Lapangan Aktif</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {activeMatches.length} Main
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Peserta Hadir</span>
                <span className="font-mono text-white font-bold">{todayCheckIns.length} / {leaguePlayers.length}</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${checkInProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="bg-[#101524] p-2.5 rounded-lg border border-white/5">
                <div className="text-[10px] font-bold text-slate-400">TOTAL LAGA</div>
                <div className="text-lg font-black text-white font-mono">{completedMatches.length}</div>
              </div>
              <div className="bg-[#101524] p-2.5 rounded-lg border border-white/5">
                <div className="text-[10px] font-bold text-slate-400">TOTAL ATLET</div>
                <div className="text-lg font-black text-amber-400 font-mono">{leaguePlayers.length}</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('matches')}
              className="w-full py-2 bg-[#12192c] hover:bg-[#18223c] text-slate-200 text-xs font-bold rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition"
            >
              <span>Buka Match Center</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* DASHBOARD 2-COLUMN SECTION: LEADERBOARD TEASER & LIVE MATCH FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: BWF TOP 5 RANKINGS TEASER */}
        <section className="clean-card bg-[#0b0f19] border-white/10 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">BWF Top 5 Leaderboard</h3>
                <p className="text-[11px] text-slate-400">Peringkat perolehan poin sementara</p>
              </div>
            </div>

            {/* Gender Toggle */}
            <div className="flex items-center bg-[#101524] p-0.5 rounded-lg border border-white/5 text-xs">
              <button
                onClick={() => setTopGender('pria')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  topGender === 'pria' ? 'bg-rose-600 text-white' : 'text-slate-400'
                }`}
              >
                Putra
              </button>
              <button
                onClick={() => setTopGender('wanita')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                  topGender === 'wanita' ? 'bg-rose-600 text-white' : 'text-slate-400'
                }`}
              >
                Putri
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {topPlayers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                Belum ada klasemen terbentuk pada kategori ini.
              </div>
            ) : (
              topPlayers.map((row, index) => {
                const isNo1 = index === 0;
                return (
                  <div
                    key={row.player.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      isNo1
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#101524] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          index === 0
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                            : index === 1
                            ? 'bg-slate-300 text-slate-950'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                          <span>{row.player.name}</span>
                          {isNo1 && <Flame size={12} className="text-amber-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.player.department} · Level {row.player.level}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono font-black text-amber-400 text-sm">
                          {row.points} <span className="text-[9px] text-amber-400/80">PTS</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.won}W - {row.lost}L
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => onNavigateTab('ranking')}
            className="w-full py-2.5 bg-[#12192c] hover:bg-[#18223c] text-rose-300 text-xs font-black uppercase tracking-wider rounded-xl border border-rose-500/20 flex items-center justify-center gap-1.5 transition"
          >
            <span>Lihat Klasemen Lengkap BWF</span>
            <ChevronRight size={14} />
          </button>
        </section>

        {/* RIGHT: RECENT MATCHES FEED */}
        <section className="clean-card bg-[#0b0f19] border-white/10 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">Hasil Laga Terkini</h3>
                <p className="text-[11px] text-slate-400">Pertandingan yang baru saja selesai</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('matches')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <span>Semua Laga</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentMatches.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                Belum ada pertandingan selesai hari ini.
              </div>
            ) : (
              recentMatches.map((m) => {
                const teamAWon = m.winnerTeam === 'teamA' || m.teamA.score > m.teamB.score;
                const teamBWon = m.winnerTeam === 'teamB' || m.teamB.score > m.teamA.score;

                return (
                  <div
                    key={m.id}
                    className="p-3 bg-[#101524] rounded-xl border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1.5">
                      <span className="font-bold text-rose-400">Lapangan {m.courtNumber}</span>
                      <span>Format: {m.format === 'RACE_42' ? 'Race 42' : 'BWF 21'} • Selesai: {m.completedAt || 'Hari Ini'}</span>
                    </div>

                    <div className="space-y-1">
                      {/* Team A */}
                      <div className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                        teamAWon ? 'bg-emerald-500/10 text-emerald-300 font-extrabold' : 'text-slate-300'
                      }`}>
                        <span className="truncate max-w-[200px]">
                          {getPlayerName(m.teamA.player1Id)} & {getPlayerName(m.teamA.player2Id)}
                        </span>
                        <span className="font-mono font-black text-sm">{m.teamA.score}</span>
                      </div>

                      {/* Team B */}
                      <div className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                        teamBWon ? 'bg-emerald-500/10 text-emerald-300 font-extrabold' : 'text-slate-300'
                      }`}>
                        <span className="truncate max-w-[200px]">
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
