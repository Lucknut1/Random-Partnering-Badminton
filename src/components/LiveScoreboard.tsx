import React, { useState } from 'react';
import { Match, Player, ScoreFormat } from '../types';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  ArrowLeftRight,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveScoreboardProps {
  match: Match;
  players: Player[];
  onUpdateScore: (matchId: string, teamAScore: number, teamBScore: number, switchedSides?: boolean) => void;
  onFinishMatch: (matchId: string, winnerTeam: 'teamA' | 'teamB') => void;
  onCancelMatch: (matchId: string) => void;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  match,
  players,
  onUpdateScore,
  onFinishMatch,
  onCancelMatch,
}) => {
  const [teamAScore, setTeamAScore] = useState(match.teamA.score);
  const [teamBScore, setTeamBScore] = useState(match.teamB.score);
  const [switchedSides, setSwitchedSides] = useState(match.switchedSides || false);
  const [currentServe, setCurrentServe] = useState<'teamA' | 'teamB'>(match.currentServe || 'teamA');

  const p1A = players.find((p) => p.id === match.teamA.player1Id);
  const p2A = players.find((p) => p.id === match.teamA.player2Id);
  const p1B = players.find((p) => p.id === match.teamB.player1Id);
  const p2B = players.find((p) => p.id === match.teamB.player2Id);

  const isRace42 = match.format === 'RACE_42';
  const targetPoints = isRace42 ? 42 : 21;
  const intervalPoint = isRace42 ? 21 : 11;

  // Check if interval reached (Pindah Sisi di Race 42)
  const isIntervalReached = (teamAScore >= intervalPoint || teamBScore >= intervalPoint) && !switchedSides;

  // Check if match won
  let isMatchWon = false;
  let winner: 'teamA' | 'teamB' | null = null;

  if (isRace42) {
    if (teamAScore >= 42) {
      isMatchWon = true;
      winner = 'teamA';
    } else if (teamBScore >= 42) {
      isMatchWon = true;
      winner = 'teamB';
    }
  } else {
    // Standar BWF: 21 points with 2 points lead, deuce max 30
    if (teamAScore >= 21 && teamAScore - teamBScore >= 2) {
      isMatchWon = true;
      winner = 'teamA';
    } else if (teamBScore >= 21 && teamBScore - teamAScore >= 2) {
      isMatchWon = true;
      winner = 'teamB';
    } else if (teamAScore === 30) {
      isMatchWon = true;
      winner = 'teamA';
    } else if (teamBScore === 30) {
      isMatchWon = true;
      winner = 'teamB';
    }
  }

  const handleAddPoint = (team: 'teamA' | 'teamB') => {
    let newScoreA = teamAScore;
    let newScoreB = teamBScore;

    if (team === 'teamA') {
      newScoreA += 1;
      setTeamAScore(newScoreA);
      setCurrentServe('teamA');
    } else {
      newScoreB += 1;
      setTeamBScore(newScoreB);
      setCurrentServe('teamB');
    }

    onUpdateScore(match.id, newScoreA, newScoreB, switchedSides);

    // If winning point scored, celebrate!
    if ((isRace42 && (newScoreA >= 42 || newScoreB >= 42)) ||
        (!isRace42 && ((newScoreA >= 21 && newScoreA - newScoreB >= 2) || (newScoreB >= 21 && newScoreB - newScoreA >= 2) || newScoreA === 30 || newScoreB === 30))) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const handleSubtractPoint = (team: 'teamA' | 'teamB') => {
    if (team === 'teamA' && teamAScore > 0) {
      const newScore = teamAScore - 1;
      setTeamAScore(newScore);
      onUpdateScore(match.id, newScore, teamBScore, switchedSides);
    } else if (team === 'teamB' && teamBScore > 0) {
      const newScore = teamBScore - 1;
      setTeamBScore(newScore);
      onUpdateScore(match.id, teamAScore, newScore, switchedSides);
    }
  };

  const handleConfirmSwitchSide = () => {
    setSwitchedSides(true);
    onUpdateScore(match.id, teamAScore, teamBScore, true);
  };

  const handleFinish = (winTeam: 'teamA' | 'teamB') => {
    onFinishMatch(match.id, winTeam);
  };

  return (
    <div className="glass-panel p-5 border border-white/15 shadow-2xl relative overflow-hidden">
      {/* Top Match Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center justify-center border border-emerald-500/30 font-mono text-sm">
            L{match.courtNumber}
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>Lapangan {match.courtNumber}</span>
              <span className="badge-format">
                {match.format === 'RACE_42' ? '⚡ Race to 42' : '🏸 Standar BWF (21)'}
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold border border-white/10">
                {match.matchType === 'MD' ? 'Ganda Putra' : match.matchType === 'WD' ? 'Ganda Putri' : 'Ganda Campuran'}
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTeamAScore(0);
              setTeamBScore(0);
              setSwitchedSides(false);
              onUpdateScore(match.id, 0, 0, false);
            }}
            className="text-xs text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
            title="Reset Skor"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Interval / Court Switch Alert for Race 42 at 21 points */}
      {isIntervalReached && (
        <div className="mb-4 p-3 bg-amber-500/20 border-2 border-amber-400/80 rounded-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <ArrowLeftRight size={18} className="text-amber-400" />
            <div>
              <p className="font-extrabold text-sm text-amber-200">PINDAH LAPANGAN (SKOR 21 TERCAPAI)!</p>
              <p className="text-[11px] font-normal text-amber-300/80">Pemain bertukar sisi lapangan dan wasit mencatat perpindahan.</p>
            </div>
          </div>
          <button
            onClick={handleConfirmSwitchSide}
            className="btn btn-gold btn-sm text-xs font-extrabold shrink-0"
          >
            Sudah Pindah Sisi ✓
          </button>
        </div>
      )}

      {/* Match Won Banner */}
      {isMatchWon && winner && (
        <div className="mb-4 p-3 bg-emerald-500/20 border-2 border-emerald-400/80 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <Trophy size={18} className="text-emerald-400" />
            <div>
              <p className="font-extrabold text-sm text-emerald-200">
                PERTANDINGAN SELESAI! Pemenang: {winner === 'teamA' ? 'TIM A' : 'TIM B'}
              </p>
              <p className="text-[11px] font-normal text-emerald-300/80">Pemenang mendapatkan +3 Poin pada klasemen.</p>
            </div>
          </div>
          <button
            onClick={() => handleFinish(winner!)}
            className="btn btn-primary btn-sm text-xs font-extrabold shrink-0 shadow-lg shadow-emerald-500/30"
          >
            Simpan Hasil (+3 Poin) ✓
          </button>
        </div>
      )}

      {/* Main Score Display Grid */}
      <div className="grid grid-cols-2 gap-4 items-stretch mb-4">
        {/* TIM A */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
          winner === 'teamA'
            ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
            : currentServe === 'teamA'
            ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-950/70 border-white/10'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-emerald-400 tracking-wider">TIM A</span>
              {currentServe === 'teamA' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  🏸 Servis
                </span>
              )}
            </div>

            {/* Players List */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate max-w-[130px]">{p1A?.name || 'Pemain 1'}</span>
                <span className={`badge-level-${p1A?.level.toLowerCase() || 'a'}`}>Lvl {p1A?.level}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate max-w-[130px]">{p2A?.name || 'Pemain 2'}</span>
                <span className={`badge-level-${p2A?.level.toLowerCase() || 'b'}`}>Lvl {p2A?.level}</span>
              </div>
            </div>
          </div>

          {/* Big Score Button */}
          <div className="mt-auto">
            <div
              onClick={() => handleAddPoint('teamA')}
              className="w-full bg-slate-900/90 hover:bg-slate-800 border-2 border-white/15 hover:border-emerald-400 rounded-2xl py-6 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 select-none group shadow-inner"
            >
              <span className="text-5xl md:text-6xl font-black text-white font-['JetBrains_Mono'] group-hover:text-emerald-300 transition-colors">
                {teamAScore}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold mt-1 group-hover:text-emerald-400">
                +1 Klik Tambah Poin
              </span>
            </div>

            {/* Sub/Undo Button */}
            <div className="flex items-center justify-between mt-2 px-1">
              <button
                onClick={() => handleSubtractPoint('teamA')}
                disabled={teamAScore === 0}
                className="text-xs text-slate-400 hover:text-red-400 font-bold disabled:opacity-30 flex items-center gap-1"
              >
                -1 Kurang
              </button>
              <button
                onClick={() => setCurrentServe('teamA')}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Pindah Servis
              </button>
            </div>
          </div>
        </div>

        {/* TIM B */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
          winner === 'teamB'
            ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
            : currentServe === 'teamB'
            ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
            : 'bg-slate-950/70 border-white/10'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-cyan-300 tracking-wider">TIM B</span>
              {currentServe === 'teamB' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  🏸 Servis
                </span>
              )}
            </div>

            {/* Players List */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate max-w-[130px]">{p1B?.name || 'Pemain 1'}</span>
                <span className={`badge-level-${p1B?.level.toLowerCase() || 'a'}`}>Lvl {p1B?.level}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate max-w-[130px]">{p2B?.name || 'Pemain 2'}</span>
                <span className={`badge-level-${p2B?.level.toLowerCase() || 'b'}`}>Lvl {p2B?.level}</span>
              </div>
            </div>
          </div>

          {/* Big Score Button */}
          <div className="mt-auto">
            <div
              onClick={() => handleAddPoint('teamB')}
              className="w-full bg-slate-900/90 hover:bg-slate-800 border-2 border-white/15 hover:border-emerald-400 rounded-2xl py-6 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 select-none group shadow-inner"
            >
              <span className="text-5xl md:text-6xl font-black text-white font-['JetBrains_Mono'] group-hover:text-emerald-300 transition-colors">
                {teamBScore}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold mt-1 group-hover:text-emerald-400">
                +1 Klik Tambah Poin
              </span>
            </div>

            {/* Sub/Undo Button */}
            <div className="flex items-center justify-between mt-2 px-1">
              <button
                onClick={() => handleSubtractPoint('teamB')}
                disabled={teamBScore === 0}
                className="text-xs text-slate-400 hover:text-red-400 font-bold disabled:opacity-30 flex items-center gap-1"
              >
                -1 Kurang
              </button>
              <button
                onClick={() => setCurrentServe('teamB')}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Pindah Servis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Finish Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
        <button
          onClick={() => onCancelMatch(match.id)}
          className="text-xs text-slate-400 hover:text-red-400 font-semibold"
        >
          Batalkan Pertandingan
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFinish('teamA')}
            className="btn btn-secondary btn-sm text-xs font-bold"
          >
            Selesai: Tim A Menang
          </button>
          <button
            onClick={() => handleFinish('teamB')}
            className="btn btn-secondary btn-sm text-xs font-bold"
          >
            Selesai: Tim B Menang
          </button>
        </div>
      </div>
    </div>
  );
};
