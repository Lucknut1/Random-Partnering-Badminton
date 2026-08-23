import React, { useState, useEffect } from 'react';
import { League } from '../types';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { Trophy, Activity, UserCheck, History, Shield, Clock, ChevronDown, Calendar, AlertCircle } from 'lucide-react';

interface NavbarProps {
  leagues: League[];
  activeLeague: League;
  onSelectLeague: (leagueId: string) => void;
  activeTab: 'standings' | 'courts' | 'checkin' | 'history' | 'admin';
  onSelectTab: (tab: 'standings' | 'courts' | 'checkin' | 'history' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  leagues,
  activeLeague,
  onSelectLeague,
  activeTab,
  onSelectTab,
}) => {
  const [timeRemainingInfo, setTimeRemainingInfo] = useState(() =>
    matchmakingEngine.calculateSessionTimeRemaining(activeLeague)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemainingInfo(matchmakingEngine.calculateSessionTimeRemaining(activeLeague));
    }, 15000); // update every 15s
    return () => clearInterval(timer);
  }, [activeLeague]);

  const activeSeason = activeLeague.seasons.find((s) => s.id === activeLeague.activeSeasonId);

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h} jam ${m} mnt`;
    return `${m} menit`;
  };

  return (
    <header className="border-b border-white/10 bg-[#0a0f1d]/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner: League Info & Live Session Status */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-white/5 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeRemainingInfo.isSessionActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${timeRemainingInfo.isSessionActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-semibold text-slate-200">{activeLeague.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 flex items-center gap-1">
            <Clock size={12} className="text-emerald-400" />
            {activeLeague.startTime} - {activeLeague.endTime} WIB ({activeLeague.venue})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Season Indicator */}
          {activeSeason && (
            <div className="bg-slate-800/80 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
              <Calendar size={12} />
              <span>{activeSeason.name}</span>
            </div>
          )}

          {/* Session Timer Badge */}
          <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium ${
            timeRemainingInfo.isSessionActive 
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : timeRemainingInfo.isSessionOver
              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
          }`}>
            <Clock size={12} />
            {timeRemainingInfo.isSessionActive ? (
              <span>Sisa Sesi: <strong>{formatMinutes(timeRemainingInfo.remainingMinutes)}</strong></span>
            ) : timeRemainingInfo.isSessionOver ? (
              <span>Sesi Hari Ini Selesai</span>
            ) : (
              <span>Sesi Belum Dimulai (Mulai {activeLeague.startTime})</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & League Selector */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => onSelectTab('standings')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m4.93 4.93 4.24 4.24"/>
                <path d="m14.83 9.17 4.24-4.24"/>
                <path d="m14.83 14.83 4.24 4.24"/>
                <path d="m9.17 14.83-4.24 4.24"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                  SHUTTLE<span className="text-emerald-400">RANK</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Dashboard Klasemen Badminton</p>
            </div>
          </div>

          {/* Quick League Selector Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer transition">
              <span className="text-xs text-slate-400">Liga:</span>
              <select
                value={activeLeague.id}
                onChange={(e) => onSelectLeague(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer border-none p-0 w-auto"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                    {l.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onSelectTab('standings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'standings'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy size={15} />
            <span>Klasemen</span>
          </button>

          <button
            onClick={() => onSelectTab('courts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'courts'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={15} />
            <span>Jadwal & Skor</span>
          </button>

          <button
            onClick={() => onSelectTab('checkin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'checkin'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck size={15} />
            <span>Check-In Kios</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <History size={15} />
            <span>Riwayat</span>
          </button>

          <button
            onClick={() => onSelectTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Shield size={15} />
            <span>Super Admin</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
