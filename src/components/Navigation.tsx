import React, { useState, useEffect } from 'react';
import { League } from '../types';
import { matchmakingEngine } from '../services/matchmakingEngine';
import { formatLocalDateShort } from '../services/dateService';
import { 
  Home, 
  Trophy, 
  Activity, 
  Users, 
  Plus, 
  Settings, 
  ChevronDown,
  Shuffle,
  LogOut,
  CalendarDays,
  Shield,
  Zap,
} from 'lucide-react';

interface NavigationProps {
  leagues: League[];
  activeLeague: League;
  onSelectLeague: (leagueId: string) => void;
  activeTab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin') => void;
  onOpenRecordModal: () => void;
  onOpenRandomPartnering: () => void;
  onLogout: () => Promise<void>;
  isAdmin: boolean;
  isLeagueHost: boolean;
  adminLabel: string | null;
  cloudStatus: 'local' | 'syncing' | 'synced' | 'error';
}

export const Navigation: React.FC<NavigationProps> = ({
  leagues,
  activeLeague,
  onSelectLeague,
  activeTab,
  onSelectTab,
  onOpenRecordModal,
  onOpenRandomPartnering,
  onLogout,
  isAdmin,
  isLeagueHost,
  adminLabel,
  cloudStatus,
}) => {
  const hasOperationalAccess = isAdmin || isLeagueHost;
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
      {/* BWF Top Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#e11d48] via-[#fbbf24] to-[#0284c7]" />

      {/* Desktop & Tablet Top Header */}
      <header className="sticky top-0 z-40 bg-[#080c16]/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & League Switcher */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left bg-transparent border-none cursor-pointer group"
              aria-label="Kembali ke Beranda Mabarek"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 p-0.5 shadow-md shadow-rose-600/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center overflow-hidden">
                  <img src="/mabarek-icon-192.png" alt="Mabarek" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base tracking-tight text-white font-['Outfit'] block leading-none">
                    MABAREK
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white">
                    BWF
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold tracking-[0.14em] uppercase">
                  MainBarengRaket
                </span>
              </div>
            </button>

            {/* League Dropdown Selector */}
            <div className="relative group hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827] border border-white/10 hover:border-rose-500/40 transition">
                <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Liga:</span>
                <select
                  value={activeLeague.id}
                  onChange={(e) => onSelectLeague(e.target.value)}
                  className="bg-transparent text-white font-extrabold text-xs border-none cursor-pointer focus:outline-none max-w-44 truncate"
                >
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#0e1424] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
            </div>

            {/* Mobile Admin Actions */}
            <div className="md:hidden flex items-center gap-1.5">
              {isAdmin && (
                <button
                  onClick={onOpenRandomPartnering}
                  className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center"
                  aria-label="Random Partnering"
                >
                  <Shuffle size={14} />
                </button>
              )}
              <button
                onClick={() => onSelectTab('admin')}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  hasOperationalAccess
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-white/10 text-slate-400'
                }`}
                aria-label="Panel Operasional"
              >
                <Settings size={14} />
              </button>
              {hasOperationalAccess && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-center"
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs (BWF Pill & Ribbon Style) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0e1424] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'dashboard'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Beranda
            </button>

            <button
              onClick={() => onSelectTab('ranking')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'ranking'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Klasemen BWF
            </button>

            <button
              onClick={() => onSelectTab('matches')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'matches'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Pertandingan
            </button>

            <button
              onClick={() => onSelectTab('players')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'players'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Peserta
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`p-1.5 rounded-lg text-xs transition ${
                hasOperationalAccess
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={isAdmin ? 'Super Admin Aktif' : isLeagueHost ? 'Host Liga Aktif' : 'Login Operasional'}
            >
              <Settings size={16} />
            </button>
          </nav>

          {/* Desktop Right CTA Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {hasOperationalAccess && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{isAdmin ? 'Super Admin' : 'Host Liga'}</span>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={onOpenRandomPartnering}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition shadow-sm"
              >
                <Shuffle size={14} />
                <span>Random Pair</span>
              </button>
            )}

            <button
              onClick={onOpenRecordModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 transition border-none cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Catat Skor</span>
            </button>

            {hasOperationalAccess && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
                title="Logout Akun Operasional"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Operating Live Status Strip */}
        <div className="bg-[#050811] border-t border-white/5 py-1.5 px-4 sm:px-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-black uppercase tracking-wider">LIVE</span>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-slate-300 truncate">{activeLeague.name}</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">{activeLeague.venue} ({activeLeague.startTime} - {activeLeague.endTime} WIB)</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[10px] font-bold ${
                cloudStatus === 'synced' ? 'text-emerald-400' : cloudStatus === 'error' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {cloudStatus === 'synced' ? '● Cloud Synced' : cloudStatus === 'syncing' ? 'Syncing...' : 'Local'}
              </span>
              <span className="font-mono font-black text-amber-400">
                {timeInfo.isSessionActive
                  ? `Sisa ${timeInfo.remainingMinutes} mnt`
                  : timeInfo.isSessionOver
                  ? 'Sesi Berakhir'
                  : `Mulai ${activeLeague.startTime}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="bottom-nav-bar md:hidden bg-[#070a14]/95 border-t border-white/10 backdrop-blur-lg">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'text-rose-400' : 'text-slate-400'}`}
        >
          <Home size={18} />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => onSelectTab('matches')}
          className={`bottom-nav-item ${activeTab === 'matches' ? 'text-rose-400' : 'text-slate-400'}`}
        >
          <Activity size={18} />
          <span>Laga</span>
        </button>

        {/* Center Record Match Floating Action Button */}
        <button
          onClick={onOpenRecordModal}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 border-2 border-[#070a14]"
          aria-label="Catat Skor"
        >
          <Plus size={22} strokeWidth={3} />
        </button>

        <button
          onClick={() => onSelectTab('ranking')}
          className={`bottom-nav-item ${activeTab === 'ranking' ? 'text-rose-400' : 'text-slate-400'}`}
        >
          <Trophy size={18} />
          <span>Klasemen</span>
        </button>

        <button
          onClick={() => onSelectTab('players')}
          className={`bottom-nav-item ${activeTab === 'players' ? 'text-rose-400' : 'text-slate-400'}`}
        >
          <Users size={18} />
          <span>Peserta</span>
        </button>
      </div>
    </>
  );
};

export default Navigation;
