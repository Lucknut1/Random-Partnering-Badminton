import React, { useState } from 'react';
import { Match, Player, League } from '../types';
import { History, Search, Trophy, Calendar, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MatchHistoryProps {
  matches: Match[];
  players: Player[];
  activeLeague: League;
  onDeleteMatch: (matchId: string) => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  matches,
  players,
  activeLeague,
  onDeleteMatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(activeLeague.activeSeasonId || 'all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const completedMatches = matches.filter((m) => {
    const isCompleted = m.status === 'COMPLETED';
    const matchesLeague = m.leagueId === activeLeague.id;
    const matchesSeason = selectedSeasonId === 'all' || m.seasonId === selectedSeasonId;
    const matchesFormat = selectedFormat === 'all' || m.format === selectedFormat;

    if (!isCompleted || !matchesLeague || !matchesSeason || !matchesFormat) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const p1A = getPlayer(m.teamA.player1Id)?.name.toLowerCase() || '';
      const p2A = getPlayer(m.teamA.player2Id)?.name.toLowerCase() || '';
      const p1B = getPlayer(m.teamB.player1Id)?.name.toLowerCase() || '';
      const p2B = getPlayer(m.teamB.player2Id)?.name.toLowerCase() || '';
      return p1A.includes(q) || p2A.includes(q) || p1B.includes(q) || p2B.includes(q);
    }

    return true;
  });

  // Sort descending by date / completed time
  completedMatches.sort((a, b) => {
    const dDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dDiff !== 0) return dDiff;
    return (b.completedAt || '').localeCompare(a.completedAt || '');
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <History className="text-emerald-400" size={26} />
            <span>Riwayat Pertandingan Selesai</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar hasil pertandingan resmi yang telah dihitung ke dalam klasemen 3 poin.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari hasil nama pemain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Season Filter */}
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg bg-slate-900 border-white/10 text-slate-200"
          >
            <option value="all">Semua Periode</option>
            {activeLeague.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg bg-slate-900 border-white/10 text-slate-200"
          >
            <option value="all">Semua Format</option>
            <option value="RACE_42">Race to 42</option>
            <option value="BWF">Standar 21</option>
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {completedMatches.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 text-xs">
          Belum ada riwayat pertandingan yang selesai pada filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedMatches.map((match) => {
            const p1A = getPlayer(match.teamA.player1Id);
            const p2A = getPlayer(match.teamA.player2Id);
            const p1B = getPlayer(match.teamB.player1Id);
            const p2B = getPlayer(match.teamB.player2Id);

            const teamAWon = match.winnerTeam === 'teamA' || match.teamA.score > match.teamB.score;
            const teamBWon = match.winnerTeam === 'teamB' || match.teamB.score > match.teamA.score;

            return (
              <div
                key={match.id}
                className="glass-panel p-4 border border-white/10 relative overflow-hidden group hover:border-white/20 transition"
              >
                {/* Match Header Tag */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Lap. {match.courtNumber}
                    </span>
                    <span className="badge-format">
                      {match.format === 'RACE_42' ? 'Race 42' : 'Standar (21)'}
                    </span>
                    <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-300">
                      {match.matchType === 'MD' ? 'Ganda Putra' : match.matchType === 'WD' ? 'Ganda Putri' : 'Ganda Campuran'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {match.date} {match.completedAt && `(${match.completedAt})`}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Hapus riwayat pertandingan ini? Poin klasemen akan diperbarui secara otomatis.')) {
                          onDeleteMatch(match.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition"
                      title="Hapus Pertandingan"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Score & Team Comparison */}
                <div className="grid grid-cols-5 items-center gap-2 py-2">
                  {/* Team A */}
                  <div className={`col-span-2 p-2.5 rounded-lg border ${
                    teamAWon ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900/60 border-white/5 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-blue-400">TIM A</span>
                      {teamAWon && <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">+3 PTS</span>}
                    </div>
                    <div className="text-xs font-extrabold truncate">{p1A?.name} <span className="text-[10px] text-slate-400 font-normal">(Lvl {p1A?.level})</span></div>
                    <div className="text-xs font-extrabold truncate">{p2A?.name} <span className="text-[10px] text-slate-400 font-normal">(Lvl {p2A?.level})</span></div>
                  </div>

                  {/* Big Score Box */}
                  <div className="col-span-1 flex flex-col items-center justify-center font-['JetBrains_Mono']">
                    <div className="text-xl font-black flex items-center gap-1.5">
                      <span className={teamAWon ? 'text-emerald-400' : 'text-slate-400'}>{match.teamA.score}</span>
                      <span className="text-slate-600 text-sm">-</span>
                      <span className={teamBWon ? 'text-emerald-400' : 'text-slate-400'}>{match.teamB.score}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans font-semibold">Selesai</span>
                  </div>

                  {/* Team B */}
                  <div className={`col-span-2 p-2.5 rounded-lg border ${
                    teamBWon ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-slate-900/60 border-white/5 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-pink-400">TIM B</span>
                      {teamBWon && <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">+3 PTS</span>}
                    </div>
                    <div className="text-xs font-extrabold truncate">{p1B?.name} <span className="text-[10px] text-slate-400 font-normal">(Lvl {p1B?.level})</span></div>
                    <div className="text-xs font-extrabold truncate">{p2B?.name} <span className="text-[10px] text-slate-400 font-normal">(Lvl {p2B?.level})</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
