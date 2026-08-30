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
  Clock,
  Shield
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
      {/* Yonex Blue Top Accent Bar */}
      <div className="h-1.5 w-full bg-[#0B50A1]" />

      {/* Main Top Header (Pure White / Yonex Structure) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#CBD5E1] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & League Selector */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left bg-transparent border-none cursor-pointer group"
              aria-label="Kembali ke Beranda"
            >
              <div className="w-9 h-9 rounded-xs bg-[#0B50A1] p-0.5 flex items-center justify-center shadow-xs">
                <div className="w-full h-full bg-white rounded-xs flex items-center justify-center overflow-hidden">
                  <img src="/mabarek-icon-192.png" alt="Mabarek" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base tracking-wider text-[#0B50A1] font-['Outfit'] block leading-none uppercase">
                    MABAREK
                  </span>
                  <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-black uppercase tracking-wider bg-[#0B50A1] text-white">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold tracking-[0.14em] uppercase">
                  MainBarengRaket
                </span>
              </div>
            </button>

            {/* League Dropdown Selector */}
            <div className="relative group hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#0B50A1] transition">
                <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">Liga:</span>
                <select
                  value={activeLeague.id}
                  onChange={(e) => onSelectLeague(e.target.value)}
                  className="bg-transparent text-[#0F172A] font-extrabold text-xs border-none cursor-pointer focus:outline-none max-w-44 truncate"
                >
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id} className="bg-white text-[#0F172A]">
                      {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="text-slate-500" />
              </div>
            </div>

            {/* Mobile Admin Quick Actions */}
            <div className="md:hidden flex items-center gap-1.5">
              {isAdmin && (
                <button
                  onClick={onOpenRandomPartnering}
                  className="w-8 h-8 rounded-xs bg-[#EBF3FC] border border-[#BCD8F8] text-[#0B50A1] flex items-center justify-center"
                  aria-label="Random Partnering"
                >
                  <Shuffle size={14} />
                </button>
              )}
              <button
                onClick={() => onSelectTab('admin')}
                className={`w-8 h-8 rounded-xs border flex items-center justify-center ${
                  hasOperationalAccess
                    ? 'border-[#0B50A1] bg-[#EBF3FC] text-[#0B50A1]'
                    : 'border-[#CBD5E1] text-slate-600'
                }`}
                aria-label="Panel Operasional"
              >
                <Settings size={14} />
              </button>
              {hasOperationalAccess && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 rounded-xs bg-red-50 border border-red-200 text-red-600 flex items-center justify-center"
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs (Yonex Structural Blue) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xs border border-[#E2E8F0]">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'dashboard'
                  ? 'bg-[#0B50A1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
              }`}
            >
              Beranda
            </button>

            <button
              onClick={() => onSelectTab('ranking')}
              className={`px-3.5 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'ranking'
                  ? 'bg-[#0B50A1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
              }`}
            >
              Klasemen
            </button>

            <button
              onClick={() => onSelectTab('matches')}
              className={`px-3.5 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'matches'
                  ? 'bg-[#0B50A1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
              }`}
            >
              Pertandingan
            </button>

            <button
              onClick={() => onSelectTab('players')}
              className={`px-3.5 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'players'
                  ? 'bg-[#0B50A1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
              }`}
            >
              Peserta
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`p-1.5 rounded-xs text-xs transition ${
                hasOperationalAccess
                  ? 'text-[#0B50A1] bg-[#EBF3FC]'
                  : 'text-slate-500 hover:text-[#0B50A1] hover:bg-white'
              }`}
              title={isAdmin ? 'Super Admin Aktif' : isLeagueHost ? 'Host Liga Aktif' : 'Login Operasional'}
            >
              <Settings size={16} />
            </button>
          </nav>

          {/* Desktop Right CTA Buttons (Yonex Green Action) */}
          <div className="hidden md:flex items-center gap-2.5">
            {hasOperationalAccess && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#EBF3FC] border border-[#BCD8F8] text-[#0B50A1] text-xs font-extrabold uppercase">
                <span className="w-2 h-2 rounded-xs bg-[#0B50A1]" />
                <span>{isAdmin ? 'Super Admin' : 'Host Liga'}</span>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={onOpenRandomPartnering}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xs text-xs font-extrabold bg-white text-[#0B50A1] border border-[#CBD5E1] hover:border-[#0B50A1] transition shadow-xs"
              >
                <Shuffle size={14} />
                <span>Random Pair</span>
              </button>
            )}

            <button
              onClick={onOpenRecordModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xs text-xs font-black uppercase tracking-wider bg-[#1D9533] hover:bg-[#157327] text-white shadow-xs transition border-none cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Catat Skor</span>
            </button>

            {hasOperationalAccess && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xs text-slate-500 hover:text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                title="Logout Akun Operasional"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Operating Live Status Strip (Outdoor Readability) */}
        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-1.5 px-4 sm:px-6 text-xs text-slate-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-xs bg-[#1D9533]" />
              <span className="text-[#1D9533] font-black uppercase tracking-wider">SESI AKTIF</span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-[#0F172A] truncate">{activeLeague.name}</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-600 hidden sm:inline">{activeLeague.venue} ({activeLeague.startTime} - {activeLeague.endTime} WIB)</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[10px] font-bold ${
                cloudStatus === 'synced' ? 'text-[#1D9533]' : cloudStatus === 'error' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {cloudStatus === 'synced' ? '● Terhubung Cloud' : cloudStatus === 'syncing' ? 'Menyinkronkan...' : 'Lokal'}
              </span>
              <span className="font-mono font-black text-[#0B50A1]">
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

      {/* Mobile Bottom Navigation Bar (Pure White) */}
      <div className="bottom-nav-bar md:hidden bg-white border-t border-[#CBD5E1]">
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

        {/* Center Record Match Button (Yonex Green Solid) */}
        <button
          onClick={onOpenRecordModal}
          className="w-11 h-11 -mt-4 rounded-xs bg-[#1D9533] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer"
          aria-label="Catat Skor"
        >
          <Plus size={20} strokeWidth={3} />
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

export default Navigation;
