import React, { useState } from 'react';
import { Match, Player, League } from '../types';
import { Activity, Search, Calendar, CheckCircle2, Edit3, Trash2, Shield, Trophy, Award, Check } from 'lucide-react';
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
  canOperate: boolean;
  onVerifyMatch: (matchId: string) => Promise<void>;
  onCorrectMatch: (matchId: string, teamAScore: number, teamBScore: number, reason: string) => Promise<void>;
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
  canOperate,
  onVerifyMatch,
  onCorrectMatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const requestCorrection = async (match: Match) => {
    const scoreAInput = prompt('Skor baru Tim A:', String(match.teamA.score));
    if (scoreAInput === null) return;
    const scoreBInput = prompt('Skor baru Tim B:', String(match.teamB.score));
    if (scoreBInput === null) return;
    const reason = prompt('Alasan koreksi, minimal 5 karakter:');
    if (reason === null) return;
    const teamAScore = Number(scoreAInput);
    const teamBScore = Number(scoreBInput);
    if (!Number.isInteger(teamAScore) || !Number.isInteger(teamBScore)) {
      alert('Skor harus berupa angka bulat.');
      return;
    }
    await onCorrectMatch(match.id, teamAScore, teamBScore, reason);
  };

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* MATCH CENTER HEADER */}
      <div className="clean-card p-5 bg-[#0d121c] border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
              MATCH CENTER
            </span>
            <span className="text-xs text-slate-400 font-semibold">{activeLeague.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] flex items-center gap-2">
            <Activity className="text-rose-500" size={22} />
            <span>Hasil & Riwayat Pertandingan</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {completedMatches.length} Laga Selesai • {activeMatches.length} Laga Sedang Berlangsung
          </p>
        </div>
      </div>

      {/* ACTIVE IN-PROGRESS MATCHES */}
      {activeMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-wider font-['Outfit']">
              Pertandingan Sedang Berlangsung ({activeMatches.length})
            </h2>
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

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Cari pertandingan berdasarkan nama atlet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2.5 text-xs rounded-xl w-full bg-[#0d121c] border-white/10 focus:border-rose-500 text-slate-200"
        />
      </div>

      {/* COMPLETED MATCH CARDS LIST */}
      {completedMatches.length === 0 ? (
        <div className="clean-card p-12 text-center text-xs text-slate-500 bg-[#0d121c]">
          Belum ada riwayat pertandingan selesai pada liga ini.
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
                className="clean-card p-4 sm:p-5 bg-[#0b101c] border-white/10 hover:border-rose-500/30 transition-all space-y-3 shadow-lg"
              >
                {/* Match Card Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-300 font-extrabold text-[10px] border border-rose-500/30">
                      LAP. {match.courtNumber}
                    </span>
                    <span className="font-bold text-slate-300">
                      {match.matchType === 'MD' ? "Men's Doubles" : match.matchType === 'WD' ? "Women's Doubles" : 'Mixed Doubles'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">{match.format === 'RACE_42' ? 'Race 42' : 'Standar 21'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span>{match.date} {match.completedAt ? `• ${match.completedAt} WIB` : ''}</span>
                    {match.verificationStatus === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Check size={11} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Lineup Display (Red Corner vs Blue Corner) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Team A (Red) */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    teamAWon
                      ? 'bg-gradient-to-r from-emerald-950/30 to-[#0e1726] border-emerald-500/40 text-white'
                      : 'bg-[#101524] border-white/5 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-white truncate">
                          {p1A?.name || 'Pemain 1'} & {p2A?.name || 'Pemain 2'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p1A?.department} · Level {p1A?.level}/{p2A?.level}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamAWon && (
                        <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                          <Award size={10} /> +3 PTS
                        </span>
                      )}
                      <span className="font-mono font-black text-xl text-white">
                        {match.teamA.score}
                      </span>
                    </div>
                  </div>

                  {/* Team B (Blue) */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    teamBWon
                      ? 'bg-gradient-to-r from-emerald-950/30 to-[#0e1726] border-emerald-500/40 text-white'
                      : 'bg-[#101524] border-white/5 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-white truncate">
                          {p1B?.name || 'Pemain 1'} & {p2B?.name || 'Pemain 2'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p1B?.department} · Level {p1B?.level}/{p2B?.level}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamBWon && (
                        <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                          <Award size={10} /> +3 PTS
                        </span>
                      )}
                      <span className="font-mono font-black text-xl text-white">
                        {match.teamB.score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Host Operational Actions Bar */}
                {canOperate && (
                  <div className="flex items-center justify-between pt-1 text-xs border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {match.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => onVerifyMatch(match.id)}
                          className="text-[11px] font-extrabold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 transition flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          <span>Verifikasi Skor</span>
                        </button>
                      )}
                      <button
                        onClick={() => requestCorrection(match)}
                        className="text-[11px] font-bold text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition flex items-center gap-1"
                      >
                        <Edit3 size={12} />
                        <span>Koreksi</span>
                      </button>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm('Hapus riwayat pertandingan ini secara permanen?')) {
                            onDeleteMatch(match.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Hapus Laga"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchHistoryView;
