import React, { useState } from 'react';
import { Match, Player, ScoreFormat } from '../types';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  ArrowLeftRight,
  Shield,
  Activity
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
          particleCount: 50,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#0B50A1', '#1D9533', '#D4AF37'],
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
    <div className="clean-card bg-white p-4 sm:p-5 border border-[#CBD5E1] shadow-xs space-y-4">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-[#0B50A1] text-white font-black flex items-center justify-center font-mono text-xs">
            L{match.courtNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-[#0B50A1] text-sm font-['Outfit'] uppercase">
                LAPANGAN {match.courtNumber}
              </h4>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
                {match.format === 'RACE_42' ? '⚡ RACE TO 42' : '🏸 STANDAR 21'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-xs font-bold border border-[#CBD5E1] uppercase">
                {match.matchType === 'MD' ? 'Ganda Putra' : match.matchType === 'WD' ? 'Ganda Putri' : 'Ganda Campuran'}
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
            className="text-xs text-slate-400 hover:text-[#0B50A1] p-1 rounded-xs hover:bg-[#F1F5F9] transition"
            title="Reset Skor"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Interval / Switch Side Notification (Gold Alert) */}
      {isIntervalReached && (
        <div className="p-3 bg-[#FFFDF0] border-2 border-[#D4AF37] rounded-xs flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2 text-[#B45309] text-xs font-bold">
            <ArrowLeftRight size={18} className="text-[#D4AF37] shrink-0" />
            <div>
              <p className="font-black text-xs sm:text-sm uppercase">INTERVAL PINDAH SISI (SKOR 21 TERCAPAI)</p>
              <p className="text-[11px] font-medium text-slate-600">Pemain bertukar sisi lapangan dan wasit mencatat perpindahan.</p>
            </div>
          </div>
          <button
            onClick={handleConfirmSwitchSide}
            className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#B45309] text-white font-black text-xs rounded-xs shadow-xs shrink-0 border-none cursor-pointer uppercase"
          >
            Pindah Sisi Selesai ✓
          </button>
        </div>
      )}

      {/* Match Won Banner (Yonex Green Solid) */}
      {isMatchWon && winner && (
        <div className="p-3 bg-[#EDF9F0] border-2 border-[#1D9533] rounded-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#157327] text-xs font-bold">
            <Trophy size={18} className="text-[#1D9533] shrink-0" />
            <div>
              <p className="font-black text-xs sm:text-sm uppercase">
                PERTANDINGAN SELESAI! PEMENANG: {winner === 'teamA' ? 'TIM A' : 'TIM B'}
              </p>
              <p className="text-[11px] font-medium text-slate-600">Pemenang berhak mendapatkan +3 Poin pada klasemen turnamen.</p>
            </div>
          </div>
          <button
            onClick={() => handleFinish(winner!)}
            className="btn-yonex-action shrink-0"
          >
            Simpan Hasil (+3 Poin) ✓
          </button>
        </div>
      )}

      {/* Scoreboard Columns: Team A vs Team B */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
        {/* TIM A (YONEX BLUE STRUCTURAL ACCENT) */}
        <div className={`p-4 rounded-xs border transition-all flex flex-col justify-between ${
          winner === 'teamA'
            ? 'bg-[#EDF9F0] border-[#1D9533] ring-2 ring-[#1D9533]/20'
            : currentServe === 'teamA'
            ? 'bg-[#F0F6FD] border-[#0B50A1]'
            : 'bg-[#F8FAFC] border-[#CBD5E1]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0B50A1]">
                TIM A
              </span>
              {currentServe === 'teamA' && (
                <span className="text-[9px] bg-[#0B50A1] text-white px-2 py-0.5 rounded-xs font-black uppercase">
                  🏸 SERVIS
                </span>
              )}
            </div>

            {/* Players */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[#0F172A] truncate max-w-[120px] uppercase">{p1A?.name || 'Pemain 1'}</span>
                <span className="badge-lvl-a text-[10px]">LVL {p1A?.level}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[#0F172A] truncate max-w-[120px] uppercase">{p2A?.name || 'Pemain 2'}</span>
                <span className="badge-lvl-b text-[10px]">LVL {p2A?.level}</span>
              </div>
            </div>
          </div>

          {/* Large Score Dial (Outdoor High Contrast) */}
          <div className="mt-auto">
            <div
              onClick={() => handleAddPoint('teamA')}
              className="w-full bg-white hover:bg-[#F0F6FD] border-2 border-[#CBD5E1] hover:border-[#0B50A1] rounded-xs py-5 flex flex-col items-center justify-center cursor-pointer transition active:scale-98 select-none shadow-xs group"
            >
              <span className="text-5xl sm:text-6xl font-black text-[#0B50A1] font-['JetBrains_Mono'] tabular-nums leading-none">
                {teamAScore}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-2 group-hover:text-[#0B50A1]">
                +1 TAMBAH POIN
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                onClick={() => handleSubtractPoint('teamA')}
                disabled={teamAScore === 0}
                className="text-slate-500 hover:text-red-600 font-bold disabled:opacity-30"
              >
                -1 Kurang
              </button>
              <button
                onClick={() => setCurrentServe('teamA')}
                className="text-[10px] text-[#0B50A1] hover:underline uppercase font-bold"
              >
                Pindah Servis
              </button>
            </div>
          </div>
        </div>

        {/* TIM B */}
        <div className={`p-4 rounded-xs border transition-all flex flex-col justify-between ${
          winner === 'teamB'
            ? 'bg-[#EDF9F0] border-[#1D9533] ring-2 ring-[#1D9533]/20'
            : currentServe === 'teamB'
            ? 'bg-[#F0F6FD] border-[#0B50A1]'
            : 'bg-[#F8FAFC] border-[#CBD5E1]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0B50A1]">
                TIM B
              </span>
              {currentServe === 'teamB' && (
                <span className="text-[9px] bg-[#0B50A1] text-white px-2 py-0.5 rounded-xs font-black uppercase">
                  🏸 SERVIS
                </span>
              )}
            </div>

            {/* Players */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[#0F172A] truncate max-w-[120px] uppercase">{p1B?.name || 'Pemain 1'}</span>
                <span className="badge-lvl-a text-[10px]">LVL {p1B?.level}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-[#0F172A] truncate max-w-[120px] uppercase">{p2B?.name || 'Pemain 2'}</span>
                <span className="badge-lvl-b text-[10px]">LVL {p2B?.level}</span>
              </div>
            </div>
          </div>

          {/* Large Score Dial */}
          <div className="mt-auto">
            <div
              onClick={() => handleAddPoint('teamB')}
              className="w-full bg-white hover:bg-[#F0F6FD] border-2 border-[#CBD5E1] hover:border-[#0B50A1] rounded-xs py-5 flex flex-col items-center justify-center cursor-pointer transition active:scale-98 select-none shadow-xs group"
            >
              <span className="text-5xl sm:text-6xl font-black text-[#0B50A1] font-['JetBrains_Mono'] tabular-nums leading-none">
                {teamBScore}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-2 group-hover:text-[#0B50A1]">
                +1 TAMBAH POIN
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <button
                onClick={() => handleSubtractPoint('teamB')}
                disabled={teamBScore === 0}
                className="text-slate-500 hover:text-red-600 font-bold disabled:opacity-30"
              >
                -1 Kurang
              </button>
              <button
                onClick={() => setCurrentServe('teamB')}
                className="text-[10px] text-[#0B50A1] hover:underline uppercase font-bold"
              >
                Pindah Servis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Finish Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xs bg-red-50 border border-red-200 font-bold transition disabled:opacity-50 uppercase"
        >
          {isCancelling ? 'Membatalkan...' : 'Batalkan Laga'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFinish('teamA')}
            className="btn-yonex-outline text-xs py-1.5 px-3 uppercase font-extrabold"
          >
            Tim A Menang
          </button>
          <button
            onClick={() => handleFinish('teamB')}
            className="btn-yonex-outline text-xs py-1.5 px-3 uppercase font-extrabold"
          >
            Tim B Menang
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveScoreboard;
