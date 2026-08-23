import React, { useEffect } from 'react';
import { StandingRow } from '../types';
import { Trophy, Medal, Award, Sparkles, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PodiumCardProps {
  topThree: StandingRow[];
  gender: 'pria' | 'wanita';
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ topThree, gender }) => {
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  useEffect(() => {
    if (first && first.won > 0) {
      // Fire confetti gently
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#22c55e', '#38bdf8'],
        });
      } catch {
        // Safe fallback if confetti fails
      }
    }
  }, [first?.player?.id, gender]);

  if (!first) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-white/10 p-6 shadow-2xl mb-8">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              Podium Klasemen Teratas • {gender === 'pria' ? 'Kategori Putra' : 'Kategori Putri'}
            </h3>
            <p className="text-xs text-slate-400">Peringkat 1, 2, dan 3 berdasarkan total poin (Menang = 3 Poin)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <Sparkles size={14} />
          <span>Top Form</span>
        </div>
      </div>

      {/* 3 Step Podium Layout */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-4 pb-2">
        {/* Peringkat 2 (Silver) - Kiri */}
        <div className="flex flex-col items-center">
          {second ? (
            <>
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-400 flex items-center justify-center shadow-lg shadow-slate-500/20 overflow-hidden">
                  <span className="text-xl md:text-2xl font-black text-slate-200">
                    {second.player.name.charAt(0)}
                  </span>
                </div>
                <div className="absolute -top-2.5 bg-slate-300 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full border border-white shadow-md flex items-center gap-1">
                  <Medal size={11} /> #2
                </div>
              </div>

              <div className="text-center w-full mb-3">
                <div className="font-extrabold text-slate-200 text-sm md:text-base truncate max-w-full">
                  {second.player.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-1">
                  {second.player.department}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`badge-level-${second.player.level.toLowerCase()}`}>
                    Level {second.player.level}
                  </span>
                </div>
              </div>

              {/* Podium Pillar 2 */}
              <div className="w-full bg-gradient-to-t from-slate-800 to-slate-700/80 border-t-2 border-slate-400 rounded-t-xl p-3 flex flex-col items-center h-28 justify-center shadow-inner">
                <span className="text-2xl font-black text-slate-200 font-['JetBrains_Mono']">
                  {second.points} <span className="text-xs font-normal text-slate-400">Pts</span>
                </span>
                <span className="text-xs text-slate-300 font-semibold mt-1">
                  {second.won}W - {second.lost}L ({second.pointDiff > 0 ? `+${second.pointDiff}` : second.pointDiff})
                </span>
              </div>
            </>
          ) : (
            <div className="h-28 w-full bg-slate-800/30 rounded-t-xl border border-white/5 flex items-center justify-center text-xs text-slate-600">
              Belum ada data
            </div>
          )}
        </div>

        {/* Peringkat 1 (Gold) - Tengah (Paling Tinggi) */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3 flex flex-col items-center">
            {/* Crown icon */}
            <div className="absolute -top-5 text-amber-400 animate-bounce">
              <Trophy size={22} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>

            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 flex items-center justify-center shadow-xl shadow-amber-500/30 overflow-hidden ring-4 ring-amber-500/20">
              <span className="text-2xl md:text-3xl font-black text-slate-950">
                {first.player.name.charAt(0)}
              </span>
            </div>

            <div className="absolute -bottom-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-3 py-0.5 rounded-full border border-amber-200 shadow-lg flex items-center gap-1">
              <Sparkles size={12} /> #1 JUARA
            </div>
          </div>

          <div className="text-center w-full mb-3 mt-1">
            <div className="font-extrabold text-amber-300 text-sm md:text-lg truncate max-w-full">
              {first.player.name}
            </div>
            <div className="text-xs text-slate-400 truncate mb-1">
              {first.player.department}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`badge-level-${first.player.level.toLowerCase()}`}>
                Level {first.player.level}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5">
                <TrendingUp size={10} /> Win Rate {first.winRate}%
              </span>
            </div>
          </div>

          {/* Podium Pillar 1 (Paling Tinggi) */}
          <div className="w-full bg-gradient-to-t from-amber-950/80 via-amber-900/60 to-amber-600/50 border-t-2 border-amber-400 rounded-t-xl p-4 flex flex-col items-center h-36 justify-center shadow-lg shadow-amber-500/10">
            <span className="text-3xl md:text-4xl font-black text-amber-300 font-['JetBrains_Mono'] tracking-tight">
              {first.points} <span className="text-xs font-normal text-amber-200/70">Pts</span>
            </span>
            <span className="text-xs text-amber-100 font-bold mt-1 bg-amber-900/80 px-2 py-0.5 rounded-full border border-amber-500/30">
              {first.won} Menang • {first.lost} Kalah
            </span>
            <span className="text-[11px] text-amber-300/80 mt-1">
              Selisih Skor: {first.pointDiff > 0 ? `+${first.pointDiff}` : first.pointDiff}
            </span>
          </div>
        </div>

        {/* Peringkat 3 (Bronze) - Kanan */}
        <div className="flex flex-col items-center">
          {third ? (
            <>
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-b from-amber-800 to-amber-950 border-2 border-amber-600 flex items-center justify-center shadow-lg shadow-amber-700/20 overflow-hidden">
                  <span className="text-xl md:text-2xl font-black text-amber-200">
                    {third.player.name.charAt(0)}
                  </span>
                </div>
                <div className="absolute -top-2.5 bg-amber-700 text-amber-100 font-black text-[11px] px-2 py-0.5 rounded-full border border-amber-400 shadow-md flex items-center gap-1">
                  <Award size={11} /> #3
                </div>
              </div>

              <div className="text-center w-full mb-3">
                <div className="font-extrabold text-slate-200 text-sm md:text-base truncate max-w-full">
                  {third.player.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-1">
                  {third.player.department}
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`badge-level-${third.player.level.toLowerCase()}`}>
                    Level {third.player.level}
                  </span>
                </div>
              </div>

              {/* Podium Pillar 3 */}
              <div className="w-full bg-gradient-to-t from-slate-900 to-amber-950/60 border-t-2 border-amber-600 rounded-t-xl p-3 flex flex-col items-center h-24 justify-center shadow-inner">
                <span className="text-2xl font-black text-amber-400 font-['JetBrains_Mono']">
                  {third.points} <span className="text-xs font-normal text-amber-200/60">Pts</span>
                </span>
                <span className="text-xs text-slate-300 font-semibold mt-1">
                  {third.won}W - {third.lost}L ({third.pointDiff > 0 ? `+${third.pointDiff}` : third.pointDiff})
                </span>
              </div>
            </>
          ) : (
            <div className="h-24 w-full bg-slate-800/30 rounded-t-xl border border-white/5 flex items-center justify-center text-xs text-slate-600">
              Belum ada data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
