import React, { useEffect } from 'react';
import { StandingRow } from '../types';
import { Trophy, Medal, Award, Sparkles, TrendingUp, Flame, Star, Shield } from 'lucide-react';
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
      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#e11d48', '#06b6d4', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [first?.player?.id, gender]);

  if (!first) {
    return null;
  }

  const categoryLabel = gender === 'pria' ? "MEN'S DIVISION (PUTRA)" : "WOMEN'S DIVISION (PUTRI)";

  return (
    <div className="space-y-4 mb-6">
      {/* BWF WORLD NO. 1 SPOTLIGHT HERO BANNER */}
      <div className="bwf-no1-spotlight relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left Column: Player Bio & Rank 1 Trophy */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-xl shadow-amber-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-[#0d121c] rounded-[14px] flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-['Outfit']">
                    {first.player.name.charAt(0)}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300/80 mt-0.5">
                    LEVEL {first.player.level}
                  </span>
                </div>
              </div>
              <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 p-1.5 rounded-full shadow-lg border border-amber-200">
                <Trophy size={14} className="fill-slate-950" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  RANKING #1 (CHAMPION)
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {categoryLabel}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                <span>{first.player.name}</span>
                <Flame size={18} className="text-amber-400 animate-pulse" />
              </h3>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="px-2 py-0.5 bg-slate-800/80 rounded border border-white/10 font-semibold text-slate-300 text-[11px]">
                  {first.player.department}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <TrendingUp size={12} /> {first.winRate}% Win Rate
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Key BWF Stats Grid */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:justify-end">
            {/* Total Points Big Display */}
            <div className="bg-[#090d16]/90 border border-amber-500/30 rounded-xl px-4 py-2.5 text-center min-w-[110px] shadow-lg">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400/80">
                TOTAL POINTS
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-['JetBrains_Mono'] leading-tight">
                {first.points}
              </div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase">PTS</div>
            </div>

            {/* Match Summary (Won / Lost) */}
            <div className="bg-[#090d16]/90 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                MATCHES
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white font-['Outfit']">
                <span className="text-emerald-400">{first.won}W</span> - <span className="text-rose-400">{first.lost}L</span>
              </div>
              <div className="text-[9px] font-semibold text-slate-400">
                Diff {first.pointDiff > 0 ? `+${first.pointDiff}` : first.pointDiff}
              </div>
            </div>

            {/* Form Streak */}
            <div className="bg-[#090d16]/90 border border-white/10 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                RECENT FORM
              </div>
              <div className="flex items-center gap-1 justify-center">
                {first.recentForm.length === 0 ? (
                  <span className="text-xs text-slate-500">-</span>
                ) : (
                  first.recentForm.map((res, i) => (
                    <span
                      key={i}
                      className={`bwf-form-circle text-[10px] ${
                        res === 'W' ? 'bwf-form-w' : 'bwf-form-l'
                      }`}
                    >
                      {res}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM STEP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* RANK 2: SILVER */}
        <div className="clean-card p-4 bg-gradient-to-b from-[#101524] to-[#0c101c] border-slate-700/60 hover:border-slate-500/60 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="bwf-rank-number-box bwf-rank-2">#2</div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Medal size={12} className="text-slate-300" /> SILVER RANK
                </div>
                <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug">
                  {second ? second.player.name : '—'}
                </h4>
              </div>
            </div>
            {second && (
              <span className="badge-lvl-a text-[10px]">
                Level {second.player.level}
              </span>
            )}
          </div>

          {second ? (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Departemen</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{second.player.department}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rekor & Win Rate</span>
                <span className="font-mono text-slate-200">
                  <strong className="text-emerald-400">{second.won}W</strong> - <strong className="text-rose-400">{second.lost}L</strong> ({second.winRate}%)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Ranking Points</span>
                <span className="font-mono font-black text-slate-200 text-base">
                  {second.points} <span className="text-[10px] text-slate-400">PTS</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">Belum ada peserta</div>
          )}
        </div>

        {/* RANK 1: GOLD (CENTER HIGHLIGHT) */}
        <div className="clean-card p-4 bg-gradient-to-b from-[#1a1710] to-[#0f1118] border-amber-500/40 hover:border-amber-400/70 shadow-lg shadow-amber-500/10 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="bwf-rank-number-box bwf-rank-1">#1</div>
              <div>
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Trophy size={12} /> GOLD CHAMPION
                </div>
                <h4 className="font-extrabold text-amber-200 text-sm sm:text-base leading-snug">
                  {first.player.name}
                </h4>
              </div>
            </div>
            <span className="badge-lvl-a text-[10px]">
              Level {first.player.level}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-amber-500/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Departemen</span>
              <span className="font-semibold text-amber-200/90 truncate max-w-[150px]">{first.player.department}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Rekor & Win Rate</span>
              <span className="font-mono text-slate-200">
                <strong className="text-emerald-400">{first.won}W</strong> - <strong className="text-rose-400">{first.lost}L</strong> ({first.winRate}%)
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-extrabold text-amber-400 uppercase">Ranking Points</span>
              <span className="font-mono font-black text-amber-300 text-lg">
                {first.points} <span className="text-[10px] text-amber-400">PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* RANK 3: BRONZE */}
        <div className="clean-card p-4 bg-gradient-to-b from-[#171110] to-[#0d0f18] border-amber-800/50 hover:border-amber-700/70 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="bwf-rank-number-box bwf-rank-3">#3</div>
              <div>
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Award size={12} className="text-amber-500" /> BRONZE RANK
                </div>
                <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug">
                  {third ? third.player.name : '—'}
                </h4>
              </div>
            </div>
            {third && (
              <span className="badge-lvl-a text-[10px]">
                Level {third.player.level}
              </span>
            )}
          </div>

          {third ? (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Departemen</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{third.player.department}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Rekor & Win Rate</span>
                <span className="font-mono text-slate-200">
                  <strong className="text-emerald-400">{third.won}W</strong> - <strong className="text-rose-400">{third.lost}L</strong> ({third.winRate}%)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Ranking Points</span>
                <span className="font-mono font-black text-amber-500 text-base">
                  {third.points} <span className="text-[10px] text-slate-400">PTS</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">Belum ada peserta</div>
          )}
        </div>
      </div>
    </div>
  );
};
