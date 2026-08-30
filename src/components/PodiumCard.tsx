import React from 'react';
import { StandingRow } from '../types';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface PodiumCardProps {
  topThree: StandingRow[];
  gender: 'pria' | 'wanita';
}

export const PodiumCard: React.FC<PodiumCardProps> = ({ topThree, gender }) => {
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  if (!first) {
    return null;
  }

  const categoryLabel = gender === 'pria' ? "KATEGORI GANDA PUTRA (MEN'S)" : "KATEGORI GANDA PUTRI (WOMEN'S)";

  return (
    <div className="space-y-3 mb-5">
      {/* 3-STEP PRECISION YONEX PODIUM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* RANK 2: YONEX BLUE CARD */}
        <div className="clean-card p-4 bg-white border-l-4 border-l-[#0B50A1] border-[#CBD5E1] flex flex-col justify-between shadow-xs">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="rank-badge-box rank-box-blue">#2</div>
              <div>
                <span className="text-[10px] font-black text-[#0B50A1] uppercase tracking-wider block">
                  RUNNER-UP (PERINGKAT 2)
                </span>
                <h4 className="font-extrabold text-[#0F172A] text-sm uppercase">
                  {second ? second.player.name : '—'}
                </h4>
              </div>
            </div>
            {second && (
              <span className="badge-lvl-a text-[10px]">
                LVL {second.player.level}
              </span>
            )}
          </div>

          {second ? (
            <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Departemen</span>
                <span className="font-bold text-slate-700 truncate max-w-[140px]">{second.player.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Rekor & Win Rate</span>
                <span className="font-mono font-bold text-slate-800">
                  <strong className="text-[#157327]">{second.won}W</strong> - <strong className="text-red-600">{second.lost}L</strong> ({second.winRate}%)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-extrabold text-[#0B50A1] uppercase">Poin Klasemen</span>
                <span className="font-mono font-black text-[#0B50A1] text-base">
                  {second.points} PTS
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-3">Belum ada data</div>
          )}
        </div>

        {/* RANK 1: YONEX GOLD CARD (CHAMPION) */}
        <div className="clean-card p-4 bg-[#FFFDF0] border-l-4 border-l-[#D4AF37] border-[#FCD34D] flex flex-col justify-between shadow-xs">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="rank-badge-box rank-box-gold">
                <Trophy size={16} className="text-[#0F172A] fill-[#0F172A]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#B45309] uppercase tracking-wider block">
                  JUARA 1 (CHAMPION)
                </span>
                <h4 className="font-black text-[#0F172A] text-sm sm:text-base uppercase tracking-tight">
                  {first.player.name}
                </h4>
              </div>
            </div>
            <span className="badge-lvl-a text-[10px]">
              LVL {first.player.level}
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#FCD34D] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Departemen</span>
              <span className="font-bold text-slate-800 truncate max-w-[140px]">{first.player.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Rekor & Win Rate</span>
              <span className="font-mono font-bold text-slate-800">
                <strong className="text-[#157327]">{first.won}W</strong> - <strong className="text-red-600">{first.lost}L</strong> ({first.winRate}%)
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-black text-[#B45309] uppercase">Poin Klasemen</span>
              <span className="font-mono font-black text-[#B45309] text-lg">
                {first.points} PTS
              </span>
            </div>
          </div>
        </div>

        {/* RANK 3: YONEX GREEN CARD */}
        <div className="clean-card p-4 bg-white border-l-4 border-l-[#1D9533] border-[#CBD5E1] flex flex-col justify-between shadow-xs">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="rank-badge-box rank-box-green">#3</div>
              <div>
                <span className="text-[10px] font-black text-[#157327] uppercase tracking-wider block">
                  PERINGKAT 3 (BRONZE)
                </span>
                <h4 className="font-extrabold text-[#0F172A] text-sm uppercase">
                  {third ? third.player.name : '—'}
                </h4>
              </div>
            </div>
            {third && (
              <span className="badge-lvl-a text-[10px]">
                LVL {third.player.level}
              </span>
            )}
          </div>

          {third ? (
            <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Departemen</span>
                <span className="font-bold text-slate-700 truncate max-w-[140px]">{third.player.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Rekor & Win Rate</span>
                <span className="font-mono font-bold text-slate-800">
                  <strong className="text-[#157327]">{third.won}W</strong> - <strong className="text-red-600">{third.lost}L</strong> ({third.winRate}%)
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-extrabold text-[#157327] uppercase">Poin Klasemen</span>
                <span className="font-mono font-black text-[#157327] text-base">
                  {third.points} PTS
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-3">Belum ada data</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PodiumCard;
