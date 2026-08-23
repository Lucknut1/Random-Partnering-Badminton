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
  adminLabel,
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
      <header className="competition-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & League Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 text-left bg-transparent border-none cursor-pointer"
              aria-label="Kembali ke ringkasan Mabarek"
            >
              <div className="brand-mark">
                <img src="/mabarek-icon-192.png" alt="" width="34" height="34" />
              </div>
              <div>
                <span className="font-extrabold text-[15px] tracking-tight text-white font-['Outfit'] block leading-none">
                  Mabarek
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-[0.12em] uppercase">MainBarengRaket</span>
              </div>
            </button>

            {/* League Dropdown Selector */}
            <div className="relative group ml-1 hidden sm:block">
              <div className="league-switcher">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Liga</span>
                <select
                  value={activeLeague.id}
                  onChange={(e) => onSelectLeague(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs p-0 border-none cursor-pointer focus:outline-none max-w-48"
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
            <div className="md:hidden flex items-center gap-1.5">
              {isAdmin && (
                <button
                  onClick={onOpenRandomPartnering}
                  className="mobile-admin-action random"
                  aria-label="Buka Random Partnering"
                >
                  <Shuffle size={15} />
                </button>
              )}
              <button
                onClick={() => onSelectTab('admin')}
                className={`rounded-lg border p-2 ${isAdmin ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/10 text-slate-400'}`}
                aria-label="Buka super admin"
              >
                <Settings size={15} />
              </button>
              {isAdmin && (
                <button onClick={onLogout} className="mobile-admin-action logout" aria-label="Logout Super Admin">
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              aria-pressed={activeTab === 'dashboard'}
              className={`desktop-nav-item ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Ringkasan
            </button>

            <button
              onClick={() => onSelectTab('ranking')}
              aria-pressed={activeTab === 'ranking'}
              className={`desktop-nav-item ${
                activeTab === 'ranking'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Klasemen
            </button>

            <button
              onClick={() => onSelectTab('matches')}
              aria-pressed={activeTab === 'matches'}
              className={`desktop-nav-item ${
                activeTab === 'matches'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Pertandingan
            </button>

            <button
              onClick={() => onSelectTab('players')}
              aria-pressed={activeTab === 'players'}
              className={`desktop-nav-item ${
                activeTab === 'players'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Peserta
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
            {isAdmin && (
              <div className="admin-online-pill" title={adminLabel || 'Super Admin'}>
                <span className="admin-online-dot" />
                <span className="admin-online-copy">
                  <strong>Admin online</strong>
                  <small>{adminLabel || 'Super Admin'}</small>
                </span>
              </div>
            )}
            {isAdmin && (
              <button onClick={onOpenRandomPartnering} className="random-partnering-action">
                <Shuffle size={15} />
                <span>Random Partnering</span>
              </button>
            )}
            <button
              onClick={onOpenRecordModal}
              className="btn-action-primary nav-primary-action"
            >
              <Plus size={15} />
              <span>Catat skor</span>
            </button>
            {isAdmin && (
              <button onClick={onLogout} className="logout-action" title="Logout Super Admin" aria-label="Logout Super Admin">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Operating Hours Info Strip */}
        <div className="session-strip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold whitespace-nowrap">
                <CalendarDays size={12} /> {formatLocalDateShort()}
              </span>
              <span className="text-slate-700">/</span>
              <span className="font-semibold text-slate-300">{activeLeague.name}</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-500 hidden sm:inline">
                {activeLeague.startTime} - {activeLeague.endTime} WIB ({activeLeague.venue})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="admin-mobile-status">
                  <span className="admin-online-dot" /> Admin online
                </span>
              )}
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
          <span>Beranda</span>
        </button>

        <button
          onClick={() => onSelectTab('matches')}
          className={`bottom-nav-item ${activeTab === 'matches' ? 'active' : ''}`}
        >
          <Activity size={18} />
          <span>Laga</span>
        </button>

        {/* Prominent Floating Center CTA */}
        <button
          onClick={onOpenRecordModal}
          className="bottom-nav-record-btn"
          title="Catat skor pertandingan"
          aria-label="Catat skor pertandingan"
        >
          <Plus size={22} />
        </button>

        <button
          onClick={() => onSelectTab('ranking')}
          className={`bottom-nav-item ${activeTab === 'ranking' ? 'active' : ''}`}
        >
          <Trophy size={18} />
          <span>Klasemen</span>
        </button>

        <button
          onClick={() => onSelectTab('players')}
          className={`bottom-nav-item ${activeTab === 'players' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Peserta</span>
        </button>
      </div>
    </>
  );
};
