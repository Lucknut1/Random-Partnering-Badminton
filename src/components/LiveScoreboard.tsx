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
  Maximize2,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveScoreboardProps {
  match: Match;
  players: Player[];
  onUpdateScore: (matchId: string, teamAScore: number, teamBScore: number, switchedSides?: boolean) => void;
  onFinishMatch: (matchId: string, winnerTeam: 'teamA' | 'teamB') => void;
  onCancelMatch: (matchId: string) => Promise<void> | void;
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
  const [isCancelling, setIsCancelling] = useState(false);

  const p1A = players.find((p) => p.id === match.teamA.player1Id);
  const p2A = players.find((p) => p.id === match.teamA.player2Id);
  const p1B = players.find((p) => p.id === match.teamB.player1Id);
  const p2B = players.find((p) => p.id === match.teamB.player2Id);

  const handleCancel = async () => {
    const confirmed = confirm(
      'Batalkan pertandingan ini? Skor tidak masuk klasemen dan pemain akan kembali tersedia untuk pasangan berikutnya.'
    );
    if (!confirmed) return;
    setIsCancelling(true);
    try {
      await onCancelMatch(match.id);
    } finally {
      setIsCancelling(false);
    }
  };

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

    if ((isRace42 && (newScoreA >= 42 || newScoreB >= 42)) ||
        (!isRace42 && ((newScoreA >= 21 && newScoreA - newScoreB >= 2) || (newScoreB >= 21 && newScoreB - newScoreA >= 2) || newScoreA === 30 || newScoreB === 30))) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f59e0b', '#10b981', '#06b6d4'],
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
    <div className="clean-card bg-[#0b101c] p-4 sm:p-5 border-white/15 shadow-2xl relative overflow-hidden space-y-4">
      {/* Top Header with BWF Court Ribbon */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center font-mono text-xs shadow-md shadow-rose-600/30">
            C{match.courtNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-white text-sm font-['Outfit']">
                COURT {match.courtNumber}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {match.format === 'RACE_42' ? '⚡ RACE TO 42' : '🏸 STANDAR 21'}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-extrabold border border-white/10 uppercase">
                {match.matchType === 'MD' ? "Men's Doubles" : match.matchType === 'WD' ? "Women's Doubles" : 'Mixed Doubles'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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

      {/* Interval / Switch Side Notification (Gold Alert) */}
      {isIntervalReached && (
        <div className="p-3 bg-amber-500/20 border-2 border-amber-400 rounded-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <ArrowLeftRight size={18} className="text-amber-400 shrink-0" />
            <div>
              <p className="font-black text-xs sm:text-sm text-amber-200 uppercase">INTERVAL PINDAH SISI (SKOR 21)</p>
              <p className="text-[11px] text-amber-300/80">Pemain bertukar sisi lapangan sesuai aturan resmi.</p>
            </div>
          </div>
          <button
            onClick={handleConfirmSwitchSide}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-md shrink-0 border-none cursor-pointer"
          >
            Pindah Sisi Selesai ✓
          </button>
        </div>
      )}

      {/* Match Won Banner */}
      {isMatchWon && winner && (
        <div className="p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
            <Trophy size={18} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-black text-xs sm:text-sm text-emerald-200 uppercase">
                PERTANDINGAN SELESAI! PEMENANG: {winner === 'teamA' ? 'TIM A (RED)' : 'TIM B (BLUE)'}
              </p>
              <p className="text-[11px] text-emerald-300/80">Pemenang berhak mendapatkan +3 Poin pada klasemen turnamen.</p>
            </div>
          </div>
          <button
            onClick={() => handleFinish(winner!)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-lg shadow-emerald-500/30 shrink-0 border-none cursor-pointer"
          >
            Simpan Hasil (+3 Poin) ✓
          </button>
        </div>
      )}

      {/* BWF Main Court Score Console (Red Corner vs Blue Corner) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
        {/* RED CORNER: TIM A */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
          winner === 'teamA'
            ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
            : currentServe === 'teamA'
            ? 'bg-[#15121e] border-rose-500/70 shadow-lg shadow-rose-500/10'
            : 'bg-[#0f1422] border-white/10'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">
                TIM A (RED)
              </span>
              {currentServe === 'teamA' && (
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-black uppercase border border-rose-500/30 flex items-center gap-1">
                  🏸 SERVIS
                </span>
              )}
            </div>

            {/* Players */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white truncate max-w-[120px] sm:max-w-[150px]">{p1A?.name || 'Pemain 1'}</span>
                <span className="badge-lvl-a text-[10px]">Lvl {p1A?.level}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white truncate max-w-[120px] sm:max-w-[150px]">{p2A?.name || 'Pemain 2'}</span>
                <span className="badge-lvl-b text-[10px]">Lvl {p2A?.level}</span>
              </div>
            </div>
          </div>

          {/* Large Point Button */}
          <div className="mt-auto">
            <div
              onClick={() => handleAddPoint('teamA')}
              className="w-full bg-[#0a0d16] hover:bg-[#111728] border-2 border-rose-500/30 hover:border-rose-400 rounded-2xl py-6 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 select-none shadow-inner group"
            >
              <span className="text-5xl sm:text-6xl font-black text-rose-200 group-hover:text-white font-['JetBrains_Mono'] transition-colors">
                {teamAScore}
              </span>
              <span className="text-[10px] text-rose-400/80 font-bold uppercase tracking-wider mt-1 group-hover:text-rose-300">
                +1 TAMBAH POIN
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                onClick={() => handleSubtractPoint('teamA')}
                disabled={teamAScore === 0}
                className="text-slate-400 hover:text-rose-400 font-bold disabled:opacity-30"
              >
                -1 Kurang
              </button>
              <button
                onClick={() => setCurrentServe('teamA')}
                className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-semibold"
              >
                Pindah Servis
              </button>
            </div>
          </div>
        </div>

        {/* BLUE CORNER: TIM B */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
          winner === 'teamB'
            ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/30'
            : currentServe === 'teamB'
            ? 'bg-[#0f1728] border-sky-500/70 shadow-lg shadow-sky-500/10'
            : 'bg-[#0f1422] border-white/10'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                TIM B (BLUE)
              </span>
              {currentServe === 'teamB' && (
                <span className="text-[9px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-black uppercase border border-sky-500/30 flex items-center gap-1">
                  🏸 SERVIS
                </span>
              )}
            </div>

            {/* Players */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white truncate max-w-[120px] sm:max-w-[150px]">{p1B?.name || 'Pemain 1'}</span>
                <span className="badge-lvl-a text-[10px]">Lvl {p1B?.level}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-white truncate max-w-[120px] sm:max-w-[150px]">{p2B?.name || 'Pemain 2'}</span>
                <span className="badge-lvl-b text-[10px]">Lvl {p2B?.level}</span>
              </div>
            </div>
          </div>

          {/* Large Point Button */}
          <div className="mt-auto">
            <div
              onClick={() => handleAddPoint('teamB')}
              className="w-full bg-[#0a0d16] hover:bg-[#111728] border-2 border-sky-500/30 hover:border-sky-400 rounded-2xl py-6 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 select-none shadow-inner group"
            >
              <span className="text-5xl sm:text-6xl font-black text-sky-200 group-hover:text-white font-['JetBrains_Mono'] transition-colors">
                {teamBScore}
              </span>
              <span className="text-[10px] text-sky-400/80 font-bold uppercase tracking-wider mt-1 group-hover:text-sky-300">
                +1 TAMBAH POIN
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                onClick={() => handleSubtractPoint('teamB')}
                disabled={teamBScore === 0}
                className="text-slate-400 hover:text-rose-400 font-bold disabled:opacity-30"
              >
                -1 Kurang
              </button>
              <button
                onClick={() => setCurrentServe('teamB')}
                className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-semibold"
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
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 font-bold transition disabled:opacity-50"
        >
          {isCancelling ? 'Membatalkan...' : 'Batalkan Pertandingan'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFinish('teamA')}
            className="btn-action-secondary text-xs py-1.5 px-3"
          >
            Selesai: Tim A Menang
          </button>
          <button
            onClick={() => handleFinish('teamB')}
            className="btn-action-secondary text-xs py-1.5 px-3"
          >
            Selesai: Tim B Menang
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveScoreboard;
