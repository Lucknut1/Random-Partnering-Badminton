import React, { useState } from 'react';
import { Match, Player, League } from '../types';
import { Activity, Search, Calendar, Trash2 } from 'lucide-react';
import { LiveScoreboard } from './LiveScoreboard';

interface MatchHistoryViewProps {
  matches: Match[];
  players: Player[];
  activeLeague: League;
  onDeleteMatch: (matchId: string) => void;
  onUpdateScore: (matchId: string, teamAScore: number, teamBScore: number, switchedSides?: boolean) => void;
  onFinishMatch: (matchId: string, winnerTeam: 'teamA' | 'teamB') => void;
  onCancelMatch: (matchId: string) => void;
  isAdmin: boolean;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  matches,
  players,
  activeLeague,
  onDeleteMatch,
  onUpdateScore,
  onFinishMatch,
  onCancelMatch,
  isAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const activeMatches = matches.filter(
    (match) => match.leagueId === activeLeague.id && match.status === 'IN_PROGRESS'
  );

  const completedMatches = matches.filter((m) => {
    const isCompleted = m.status === 'COMPLETED';
    const matchesLeague = m.leagueId === activeLeague.id;

    if (!isCompleted || !matchesLeague) return false;

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

  completedMatches.sort((a, b) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (d !== 0) return d;
    return (b.completedAt || '').localeCompare(a.completedAt || '');
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-['Outfit']">
            <Activity className="text-emerald-400" size={22} />
            <span>Match History</span>
          </h1>
          <p className="text-xs text-slate-400">
            Daftar hasil pertandingan selesai ({completedMatches.length} Laga)
          </p>
        </div>
      </div>

      {activeMatches.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-extrabold text-emerald-300">Pertandingan Berlangsung</h2>
            <p className="text-[11px] text-slate-400">Skor tersimpan otomatis. Selesaikan laga agar klasemen diperbarui.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeMatches.map((match) => (
              <LiveScoreboard
                key={match.id}
                match={match}
                players={players}
                onUpdateScore={onUpdateScore}
                onFinishMatch={onFinishMatch}
                onCancelMatch={onCancelMatch}
              />
            ))}
          </div>
        </section>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          placeholder="Cari nama pemain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 pr-3 py-2 text-xs rounded-lg"
        />
      </div>

      {/* Match Cards List */}
      {completedMatches.length === 0 ? (
        <div className="clean-card p-8 text-center text-xs text-slate-500">
          Belum ada riwayat pertandingan selesai.
        </div>
      ) : (
        <div className="space-y-3">
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
                className="clean-card p-4 space-y-2.5 relative group hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-400">Lap. {match.courtNumber}</span>
                    <span className="badge-sport-format">
                      {match.format === 'RACE_42' ? 'Race 42' : 'BWF 21'}
                    </span>
                    <span className="text-slate-400">
                      {match.matchType === 'MD' ? 'Ganda Putra' : match.matchType === 'WD' ? 'Ganda Putri' : 'Ganda Campuran'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {match.date}
                    </span>
                    {isAdmin && <button
                      onClick={() => {
                        if (confirm('Hapus hasil pertandingan ini?')) {
                          onDeleteMatch(match.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition"
                      title="Hapus Pertandingan"
                    >
                      <Trash2 size={12} />
                    </button>}
                  </div>
                </div>

                {/* Teams & Scores */}
                <div className="space-y-2">
                  {/* Team A */}
                  <div className={`flex items-center justify-between p-2 rounded-lg ${
                    teamAWon ? 'bg-emerald-500/10 text-white font-bold' : 'text-slate-300'
                  }`}>
                    <div className="truncate pr-2 text-xs">
                      <span>{p1A?.name}</span> <span className="text-[10px] text-slate-400">(Lvl {p1A?.level})</span> & <span>{p2A?.name}</span> <span className="text-[10px] text-slate-400">(Lvl {p2A?.level})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamAWon && <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">+3 PTS</span>}
                      <span className="mono-num text-base font-black text-white">{match.teamA.score}</span>
                    </div>
                  </div>

                  {/* Team B */}
                  <div className={`flex items-center justify-between p-2 rounded-lg ${
                    teamBWon ? 'bg-emerald-500/10 text-white font-bold' : 'text-slate-300'
                  }`}>
                    <div className="truncate pr-2 text-xs">
                      <span>{p1B?.name}</span> <span className="text-[10px] text-slate-400">(Lvl {p1B?.level})</span> & <span>{p2B?.name}</span> <span className="text-[10px] text-slate-400">(Lvl {p2B?.level})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamBWon && <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">+3 PTS</span>}
                      <span className="mono-num text-base font-black text-white">{match.teamB.score}</span>
                    </div>
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
