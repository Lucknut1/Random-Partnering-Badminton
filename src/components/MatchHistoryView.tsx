import React, { useState } from 'react';
import { Match, Player, League } from '../types';
import { Activity, Search, Calendar, CheckCircle2, Edit3, Trash2, Shield, Check } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* 1. MATCH CENTER HEADER */}
      <div className="clean-card p-4 sm:p-5 bg-white border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
              PUSAT PERTANDINGAN
            </span>
            <span className="text-xs text-slate-500 font-semibold">{activeLeague.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B50A1] font-['Outfit'] tracking-wider uppercase flex items-center gap-2">
            <Activity className="text-[#0B50A1]" size={22} />
            <span>HASIL & RIWAYAT PERTANDINGAN</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Total {completedMatches.length} Laga Selesai • {activeMatches.length} Laga Sedang Berlangsung
          </p>
        </div>
      </div>

      {/* 2. ACTIVE IN-PROGRESS MATCHES */}
      {activeMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1D9533]" />
            <h2 className="text-xs font-black text-[#157327] uppercase tracking-wider font-['Outfit']">
              PERTANDINGAN SEDANG BERLANGSUNG ({activeMatches.length})
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

      {/* 3. SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          placeholder="Cari pertandingan berdasarkan nama atlet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 text-xs rounded-xs w-full bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0B50A1]"
        />
      </div>

      {/* 4. COMPLETED MATCH CARDS LIST (CLEAN LIGHT HIGH CONTRAST) */}
      {completedMatches.length === 0 ? (
        <div className="clean-card p-12 text-center text-xs text-slate-500 bg-white">
          Belum ada riwayat pertandingan selesai pada liga ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                className="clean-card p-4 bg-white border border-[#CBD5E1] hover:border-[#0B50A1] transition-all space-y-3 shadow-xs"
              >
                {/* Match Card Header */}
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-[#E2E8F0] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-xs bg-[#EBF3FC] text-[#0B50A1] font-black text-[10px] border border-[#BCD8F8]">
                      LAP. {match.courtNumber}
                    </span>
                    <span className="font-bold text-[#0F172A] uppercase text-[11px]">
                      {match.matchType === 'MD' ? 'Ganda Putra' : match.matchType === 'WD' ? 'Ganda Putri' : 'Ganda Campuran'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[10px] font-mono text-slate-600">{match.format === 'RACE_42' ? 'Race 42' : 'Standar 21'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-mono text-slate-500">{match.date} {match.completedAt ? `• ${match.completedAt} WIB` : ''}</span>
                    {match.verificationStatus === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#157327] bg-[#EDF9F0] px-2 py-0.5 rounded-xs border border-[#A3E3B1]">
                        <Check size={11} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Lineup Display */}
                <div className="space-y-1.5">
                  {/* Team A */}
                  <div className={`p-2.5 rounded-xs border flex items-center justify-between ${
                    teamAWon
                      ? 'bg-[#EDF9F0] border-[#A3E3B1] text-[#157327]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700'
                  }`}>
                    <div className="truncate pr-2">
                      <div className="font-black text-xs uppercase truncate text-[#0F172A]">
                        {p1A?.name || 'Pemain 1'} & {p2A?.name || 'Pemain 2'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {p1A?.department} · LVL {p1A?.level}/{p2A?.level}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamAWon && (
                        <span className="badge-status-win text-[10px]">
                          +3 PTS
                        </span>
                      )}
                      <span className="font-mono font-black text-xl text-[#0F172A] tabular-nums">
                        {match.teamA.score}
                      </span>
                    </div>
                  </div>

                  {/* Team B */}
                  <div className={`p-2.5 rounded-xs border flex items-center justify-between ${
                    teamBWon
                      ? 'bg-[#EDF9F0] border-[#A3E3B1] text-[#157327]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700'
                  }`}>
                    <div className="truncate pr-2">
                      <div className="font-black text-xs uppercase truncate text-[#0F172A]">
                        {p1B?.name || 'Pemain 1'} & {p2B?.name || 'Pemain 2'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {p1B?.department} · LVL {p1B?.level}/{p2B?.level}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamBWon && (
                        <span className="badge-status-win text-[10px]">
                          +3 PTS
                        </span>
                      )}
                      <span className="font-mono font-black text-xl text-[#0F172A] tabular-nums">
                        {match.teamB.score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Host Actions */}
                {canOperate && (
                  <div className="flex items-center justify-between pt-1 text-xs border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      {match.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => onVerifyMatch(match.id)}
                          className="text-[11px] font-extrabold text-[#157327] hover:bg-[#EDF9F0] px-2.5 py-1 rounded-xs border border-[#A3E3B1] transition flex items-center gap-1 uppercase"
                        >
                          <CheckCircle2 size={12} />
                          <span>Verifikasi Skor</span>
                        </button>
                      )}
                      <button
                        onClick={() => requestCorrection(match)}
                        className="text-[11px] font-bold text-slate-600 hover:text-[#0B50A1] px-2 py-1 rounded-xs border border-[#CBD5E1] transition flex items-center gap-1 uppercase"
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
                        className="text-slate-400 hover:text-red-600 p-1"
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
