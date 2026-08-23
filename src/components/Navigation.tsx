import React, { useState, useEffect } from 'react';
import { League } from '../types';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { 
  Home, 
  Trophy, 
  Activity, 
  Users, 
  Plus, 
  Settings, 
  Clock, 
  ChevronDown,
  Calendar
} from 'lucide-react';

interface NavigationProps {
  leagues: League[];
  activeLeague: League;
  onSelectLeague: (leagueId: string) => void;
  activeTab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin') => void;
  onOpenRecordModal: () => void;
  isAdmin: boolean;
  cloudStatus: 'local' | 'syncing' | 'synced' | 'error';
}

export const Navigation: React.FC<NavigationProps> = ({
  leagues,
  activeLeague,
  onSelectLeague,
  activeTab,
  onSelectTab,
  onOpenRecordModal,
  isAdmin,
  cloudStatus,
}) => {
  const [timeInfo, setTimeInfo] = useState(() =>
    matchmakingEngine.calculateSessionTimeRemaining(activeLeague)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(matchmakingEngine.calculateSessionTimeRemaining(activeLeague));
    }, 15000);
    return () => clearInterval(timer);
  }, [activeLeague]);

  const activeSeason = activeLeague.seasons.find((s) => s.id === activeLeague.activeSeasonId);

  return (
    <>
      {/* Desktop & Tablet Top Header */}
      <header className="border-b border-white/5 bg-[#0b0f17]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo & League Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 text-left bg-transparent border-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m4.93 4.93 4.24 4.24"/>
                  <path d="m14.83 9.17 4.24-4.24"/>
                  <path d="m14.83 14.83 4.24 4.24"/>
                  <path d="m9.17 14.83-4.24 4.24"/>
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider text-white uppercase font-['Outfit'] block leading-none">
                  BADMINTON TRACKER
                </span>
                <span className="text-[10px] text-slate-400 font-medium">ShuttleRank v2.0</span>
              </div>
            </button>

            {/* League Dropdown Selector */}
            <div className="relative group ml-2">
              <div className="flex items-center gap-1.5 bg-[#131a26] hover:bg-[#1a2333] border border-white/10 rounded-lg px-2.5 py-1 text-xs transition cursor-pointer">
                <span className="text-slate-400 text-[11px]">Liga:</span>
                <select
                  value={activeLeague.id}
                  onChange={(e) => onSelectLeague(e.target.value)}
                  className="bg-transparent text-emerald-400 font-bold text-xs p-0 border-none cursor-pointer focus:outline-none"
                >
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#131a26] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
            </div>
            <button
              onClick={() => onSelectTab('admin')}
              className={`md:hidden rounded-lg border p-2 ${isAdmin ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/10 text-slate-400'}`}
              aria-label="Buka super admin"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => onSelectTab('ranking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'ranking'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Ranking
            </button>

            <button
              onClick={() => onSelectTab('matches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'matches'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Match History
            </button>

            <button
              onClick={() => onSelectTab('players')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'players'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Players
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`p-2 rounded-lg text-xs hover:bg-white/5 transition ml-1 ${isAdmin ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
              title={isAdmin ? 'Super Admin aktif' : 'Login Super Admin'}
            >
              <Settings size={16} />
            </button>
          </nav>

          {/* Desktop Primary CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenRecordModal}
              className="btn-action-primary text-xs py-2 px-3.5 shadow-md shadow-emerald-500/15"
            >
              <Plus size={15} />
              <span>Record Match</span>
            </button>
          </div>
        </div>

        {/* Operating Hours Info Strip */}
        <div className="border-t border-white/5 bg-[#0e141f] py-1 px-4 text-[11px] text-slate-400">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-300">{activeLeague.name}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                {activeLeague.startTime} - {activeLeague.endTime} WIB ({activeLeague.venue})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`hidden sm:inline text-[10px] font-bold ${
                cloudStatus === 'synced' ? 'text-emerald-400' : cloudStatus === 'error' ? 'text-red-400' : 'text-slate-500'
              }`}>
                {cloudStatus === 'synced' ? 'Cloud tersinkron' : cloudStatus === 'syncing' ? 'Menyinkronkan...' : cloudStatus === 'error' ? 'Cloud bermasalah' : 'Mode lokal'}
              </span>
              {activeSeason && (
                <span className="text-amber-300/90 font-medium hidden sm:inline">
                  {activeSeason.name}
                </span>
              )}
              <span className="text-emerald-400 font-mono font-semibold">
                {timeInfo.isSessionActive
                  ? `Sisa ${timeInfo.remainingMinutes} mnt`
                  : timeInfo.isSessionOver
                  ? 'Sesi Selesai'
                  : `Mulai ${activeLeague.startTime}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile) */}
      <div className="bottom-nav-bar md:hidden">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          onClick={() => onSelectTab('matches')}
          className={`bottom-nav-item ${activeTab === 'matches' ? 'active' : ''}`}
        >
          <Activity size={18} />
          <span>Matches</span>
        </button>

        {/* Prominent Floating Center CTA */}
        <button
          onClick={onOpenRecordModal}
          className="bottom-nav-record-btn"
          title="Record Match"
        >
          <Plus size={22} />
        </button>

        <button
          onClick={() => onSelectTab('ranking')}
          className={`bottom-nav-item ${activeTab === 'ranking' ? 'active' : ''}`}
        >
          <Trophy size={18} />
          <span>Ranking</span>
        </button>

        <button
          onClick={() => onSelectTab('players')}
          className={`bottom-nav-item ${activeTab === 'players' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Players</span>
        </button>
      </div>
    </>
  );
};
