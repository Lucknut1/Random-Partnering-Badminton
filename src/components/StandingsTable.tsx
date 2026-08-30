import React, { useState } from 'react';
import { Player, Match, League, Gender, SkillLevel } from '../types';
import { standingsEngine } from '../services/standingsEngine';
import { getLocalDate } from '../services/dateService';
import { PodiumCard } from './PodiumCard';
import { 
  Trophy, 
  Search, 
  Download, 
  Users, 
  TrendingUp, 
  HelpCircle,
  Award,
  ChevronRight,
  Shield,
  Zap,
  Sparkles,
  ArrowUpRight,
  Minus
} from 'lucide-react';

interface StandingsTableProps {
  players: Player[];
  matches: Match[];
  activeLeague: League;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  players,
  matches,
  activeLeague,
}) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('pria');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'ALL'>('ALL');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(activeLeague.activeSeasonId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Calculate Standings
  const standings = standingsEngine.calculateStandings(players, matches, {
    leagueId: activeLeague.id,
    seasonId: selectedSeasonId,
    gender: selectedGender,
    level: selectedLevel,
  });

  // Filter with search query
  const filteredStandings = standings.filter(
    (row) =>
      row.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.player.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = standings.slice(0, 3);

  // Export to CSV with formula injection sanitization
  const handleExportCSV = () => {
    const sanitizeCsvValue = (val: unknown): string => {
      const str = String(val ?? '');
      const escaped = str.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(escaped)) {
        return `"'${escaped}"`;
      }
      return `"${escaped}"`;
    };

    const headers = [
      'Rank',
      'Player Name',
      'Gender',
      'Level',
      'Department',
      'Matches',
      'Won',
      'Lost',
      'Points (PTS)',
      'Points For (PF)',
      'Points Against (PA)',
      'Point Diff (+/-)',
      'Win Rate (%)'
    ];

    const rows = filteredStandings.map((r) => [
      r.rank,
      sanitizeCsvValue(r.player.name),
      sanitizeCsvValue(r.player.gender === 'pria' ? 'Pria' : 'Wanita'),
      sanitizeCsvValue(`Level ${r.player.level}`),
      sanitizeCsvValue(r.player.department),
      r.played,
      r.won,
      r.lost,
      r.points,
      r.pointsFor,
      r.pointsAgainst,
      r.pointDiff,
      sanitizeCsvValue(`${r.winRate}%`),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.map(sanitizeCsvValue).join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Klasemen_${activeLeague.name}_${selectedGender}_${getLocalDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const countGender = (g: Gender) =>
    players.filter((p) => p.gender === g && (p.leagueId === activeLeague.id || p.leagueId === 'all')).length;

  return (
    <div className="space-y-6">
      {/* OFFICIAL HEADER & CATEGORY SWITCHER */}
      <div className="clean-card p-4 sm:p-5 bg-gradient-to-r from-[#0d121c] via-[#101524] to-[#0d121c] border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Shield size={11} className="text-rose-400" /> SISTEM RANKING RESMI
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                Updated: {getLocalDate()}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
              <span>Klasemen & Peringkat Liga</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Liga: <strong className="text-slate-200">{activeLeague.name}</strong> • 3 Poin per Kemenangan (W)
            </p>
          </div>

          {/* BWF Category Tabs (Men's / Women's) */}
          <div className="bwf-category-tabs self-start lg:self-auto">
            <button
              onClick={() => setSelectedGender('pria')}
              className={`bwf-category-tab ${selectedGender === 'pria' ? 'active-mens' : ''}`}
            >
              <Users size={14} />
              <span>PUTRA (MEN)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                {countGender('pria')}
              </span>
            </button>

            <button
              onClick={() => setSelectedGender('wanita')}
              className={`bwf-category-tab ${selectedGender === 'wanita' ? 'active-womens' : ''}`}
            >
              <Users size={14} />
              <span>PUTRI (WOMEN)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                {countGender('wanita')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM / WORLD #1 SHOWCASE */}
      <PodiumCard topThree={topThree} gender={selectedGender} />

      {/* FILTER CONTROLS BAR (BWF STYLE) */}
      <div className="clean-card p-3 sm:p-4 bg-[#0a0e18] border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Cari atlet atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg w-full bg-[#101524] border-white/10 focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#101524] p-1 rounded-lg border border-white/5 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-bold uppercase tracking-wider">Level:</span>
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-extrabold transition ${
                selectedLevel === 'ALL' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              SEMUA
            </button>
            <button
              onClick={() => setSelectedLevel('A')}
              className={`px-2.5 py-1 rounded text-xs font-extrabold transition ${
                selectedLevel === 'A' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              LVL A
            </button>
            <button
              onClick={() => setSelectedLevel('B')}
              className={`px-2.5 py-1 rounded text-xs font-extrabold transition ${
                selectedLevel === 'B' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              LVL B
            </button>
          </div>

          {/* Season / Week Selector */}
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg bg-[#101524] border-white/10 text-slate-200 font-bold focus:outline-none"
          >
            <option value="all">Semua Periode Liga</option>
            {activeLeague.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isActive ? '(Aktif)' : ''}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="btn-action-secondary text-xs py-1.5 px-3"
            title="Download CSV Ranking"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV Klasemen</span>
          </button>

          {/* Rules Modal Button */}
          <button
            onClick={() => setShowRuleModal(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            title="Aturan Perhitungan Poin"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* LEADERBOARD TABLE */}
      <div className="bwf-table-container">
        <table className="bwf-table">
          <thead>
            <tr>
              <th className="w-16 text-center">RANK</th>
              <th>PLAYER / DIVISION</th>
              <th className="text-center">LEVEL</th>
              <th className="text-center" title="Matches Played">MATCHES</th>
              <th className="text-center" title="Won - Lost">WIN - LOSS</th>
              <th className="text-center font-bold text-amber-400" title="Total Ranking Points">POINTS</th>
              <th className="text-center" title="Points For / Points Against">PF / PA</th>
              <th className="text-center" title="Score Differential">DIFF</th>
              <th className="text-center" title="Win Rate Percentage">WIN RATE</th>
              <th className="text-center">FORM (LAST 5)</th>
            </tr>
          </thead>
          <tbody>
            {filteredStandings.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-slate-500 text-sm">
                  Belum ada catatan pertandingan untuk kategori atau filter ini.
                </td>
              </tr>
            ) : (
              filteredStandings.map((row) => {
                const isRank1 = row.rank === 1 && row.points > 0;
                const isRank2 = row.rank === 2 && row.points > 0;
                const isRank3 = row.rank === 3 && row.points > 0;
                const totalWL = row.won + row.lost;
                const winPercent = totalWL > 0 ? Math.round((row.won / totalWL) * 100) : 0;

                return (
                  <tr
                    key={row.player.id}
                    className={
                      isRank1
                        ? 'bg-amber-500/[0.04]'
                        : isRank2
                        ? 'bg-slate-400/[0.03]'
                        : isRank3
                        ? 'bg-amber-800/[0.03]'
                        : ''
                    }
                  >
                    {/* Rank Badge */}
                    <td className="text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            isRank1
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : isRank2
                              ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950'
                              : isRank3
                              ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100'
                              : 'bg-slate-800/80 text-slate-400 border border-white/5'
                          }`}
                        >
                          {row.rank}
                        </span>
                        {isRank1 ? (
                          <span className="bwf-movement-up text-[9px]">★ NO.1</span>
                        ) : (
                          <span className="bwf-movement-steady text-[9px]">—</span>
                        )}
                      </div>
                    </td>

                    {/* Player Info */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs text-slate-200 shadow-inner">
                          {row.player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-white flex items-center gap-1.5 text-sm">
                            <span>{row.player.name}</span>
                            {isRank1 && <Award size={13} className="text-amber-400" />}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <span>{row.player.department}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="text-center">
                      <span className={`badge-lvl-${row.player.level.toLowerCase()}`}>
                        Level {row.player.level}
                      </span>
                    </td>

                    {/* Matches */}
                    <td className="text-center font-bold text-slate-300 font-mono text-xs">
                      {row.played}
                    </td>

                    {/* Win - Loss Record & Mini Bar */}
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-xs font-bold">
                          <strong className="text-emerald-400">{row.won}W</strong> - <strong className="text-rose-400">{row.lost}L</strong>
                        </span>
                        {totalWL > 0 && (
                          <div className="bwf-wl-bar">
                            <div
                              className="bwf-wl-bar-win"
                              style={{ width: `${winPercent}%` }}
                            />
                            <div
                              className="bwf-wl-bar-loss"
                              style={{ width: `${100 - winPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Points Highlight */}
                    <td className="text-center">
                      <span className="bwf-points-badge">
                        <span>{row.points}</span>
                        <span className="text-[9px] font-bold text-amber-300/80">PTS</span>
                      </span>
                    </td>

                    {/* PF / PA */}
                    <td className="text-center text-xs font-mono text-slate-300">
                      <span>{row.pointsFor}</span> / <span className="text-slate-400">{row.pointsAgainst}</span>
                    </td>

                    {/* Differential (+/-) */}
                    <td className="text-center font-mono font-bold text-xs">
                      <span
                        className={
                          row.pointDiff > 0
                            ? 'text-emerald-400'
                            : row.pointDiff < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                      </span>
                    </td>

                    {/* Win Rate */}
                    <td className="text-center">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          row.winRate >= 70
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : row.winRate >= 50
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {row.winRate}%
                      </span>
                    </td>

                    {/* Form (Last 5) */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.recentForm.length === 0 ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          row.recentForm.map((result, idx) => (
                            <span
                              key={idx}
                              className={`bwf-form-circle ${
                                result === 'W' ? 'bwf-form-w' : 'bwf-form-l'
                              }`}
                              title={result === 'W' ? 'Menang' : 'Kalah'}
                            >
                              {result}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rules Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="clean-card max-w-lg w-full p-6 space-y-4 border-white/20 shadow-2xl bg-[#0c101c]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="text-amber-400" size={20} />
                <span>Aturan Perhitungan Ranking Turnamen</span>
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="font-bold text-emerald-400 text-sm mb-1">1. Sistem Poin Pertandingan:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Menang (Win):</strong> +3 Poin</li>
                  <li><strong>Kalah (Loss):</strong> 0 Poin</li>
                </ul>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <p className="font-bold text-rose-400 text-sm mb-1">2. Urutan Penentuan Ranking (Tie-Breaker):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li><strong>Total Ranking Points (PTS)</strong></li>
                  <li><strong>Jumlah Kemenangan Terbanyak (W)</strong></li>
                  <li><strong>Selisih Skor Poin (+/- Diff: PF - PA)</strong></li>
                  <li><strong>Total Poin Skor Masuk (PF)</strong></li>
                  <li><strong>Persentase Win Rate (%)</strong></li>
                </ol>
              </div>

              <div className="p-3 bg-slate-800/80 border border-white/10 rounded-xl">
                <p className="font-bold text-slate-200 text-sm mb-1">3. Jaminan Main & Level Fair Play:</p>
                <p>Peserta dikelompokkan ke <strong>Level A</strong> dan <strong>Level B</strong> untuk memastikan kesetaraan pertandingan dan perolehan poin yang kompetitif.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setShowRuleModal(false)} className="btn-action-primary px-4 py-2 text-xs">
                Tutup & Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
