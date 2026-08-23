import React, { useState } from 'react';
import { Player, Match, League, Gender, SkillLevel } from '../types';
import { standingsEngine } from '../services/standingsEngine';
import { getLocalDate } from '../services/dateService';
import { PodiumCard } from './PodiumCard';
import { 
  Trophy, 
  Search, 
  Filter, 
  Download, 
  Users, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  HelpCircle
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

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Peringkat', 'Nama', 'Gender', 'Level', 'Departemen', 'Main', 'Menang', 'Kalah', 'Poin', 'Skor Masuk (PF)', 'Skor Kebobolan (PA)', 'Selisih (+/-)', 'Win Rate (%)'];
    const rows = filteredStandings.map((r) => [
      r.rank,
      `"${r.player.name}"`,
      r.player.gender === 'pria' ? 'Pria' : 'Wanita',
      `Level ${r.player.level}`,
      `"${r.player.department}"`,
      r.played,
      r.won,
      r.lost,
      r.points,
      r.pointsFor,
      r.pointsAgainst,
      r.pointDiff,
      `${r.winRate}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Klasemen_${activeLeague.name}_${selectedGender}_${getLocalDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Gender Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Trophy className="text-amber-400" size={26} />
            <span>Klasemen Pertandingan Perorangan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sistem 3 Poin per Kemenangan • Liga: <span className="text-emerald-400 font-semibold">{activeLeague.name}</span>
          </p>
        </div>

        {/* Gender Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setSelectedGender('pria')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              selectedGender === 'pria'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={15} />
            <span>Kategori Putra (Men)</span>
            <span className="bg-blue-950/80 text-blue-200 px-2 py-0.5 rounded-full text-[10px]">
              {players.filter((p) => p.gender === 'pria' && (p.leagueId === activeLeague.id || p.leagueId === 'all')).length}
            </span>
          </button>

          <button
            onClick={() => setSelectedGender('wanita')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              selectedGender === 'wanita'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={15} />
            <span>Kategori Putri (Women)</span>
            <span className="bg-pink-950/80 text-pink-200 px-2 py-0.5 rounded-full text-[10px]">
              {players.filter((p) => p.gender === 'wanita' && (p.leagueId === activeLeague.id || p.leagueId === 'all')).length}
            </span>
          </button>
        </div>
      </div>

      {/* Podium Visualization */}
      <PodiumCard topThree={topThree} gender={selectedGender} />

      {/* Filters & Control Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama peserta atau departemen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs rounded-lg"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-white/5">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Level:</span>
          <button
            onClick={() => setSelectedLevel('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              selectedLevel === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setSelectedLevel('A')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              selectedLevel === 'A' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Level A
          </button>
          <button
            onClick={() => setSelectedLevel('B')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${
              selectedLevel === 'B' ? 'bg-sky-500/30 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-sky-400'
            }`}
          >
            Level B
          </button>
        </div>

        {/* Season Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg bg-slate-900 border-white/10 text-slate-200"
          >
            <option value="all">Semua Periode / Sepanjang Waktu</option>
            {activeLeague.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isActive ? '(Aktif)' : ''}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Rule Modal Trigger */}
          <button
            onClick={() => setShowRuleModal(true)}
            className="btn btn-secondary btn-sm text-slate-400 hover:text-white"
            title="Aturan Klasemen"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl">
        <div className="shuttle-table-container">
          <table className="shuttle-table">
            <thead>
              <tr>
                <th className="w-14 text-center">POS</th>
                <th>PESERTA</th>
                <th className="text-center">LEVEL</th>
                <th className="text-center" title="Main">M</th>
                <th className="text-center text-emerald-400" title="Menang">W</th>
                <th className="text-center text-red-400" title="Kalah">L</th>
                <th className="text-center text-amber-300 font-extrabold text-sm" title="Total Poin (Menang = 3 Poin)">POIN</th>
                <th className="text-center" title="Poin Skor Masuk (Points For)">PF</th>
                <th className="text-center" title="Poin Skor Kebobolan (Points Against)">PA</th>
                <th className="text-center font-bold" title="Selisih Skor Menang - Kalah">+/-</th>
                <th className="text-center" title="Win Rate %">WIN%</th>
                <th className="text-center">FORM (5 LAGA)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-500 text-sm">
                    Belum ada peserta atau pertandingan pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredStandings.map((row) => {
                  const isTopOne = row.rank === 1 && row.points > 0;
                  const isTopTwo = row.rank === 2 && row.points > 0;
                  const isTopThree = row.rank === 3 && row.points > 0;

                  return (
                    <tr
                      key={row.player.id}
                      className={
                        isTopOne
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : isTopTwo
                          ? 'bg-slate-400/5 hover:bg-slate-400/10'
                          : isTopThree
                          ? 'bg-amber-800/5 hover:bg-amber-800/10'
                          : ''
                      }
                    >
                      {/* Rank Position */}
                      <td className="text-center font-bold">
                        <span
                          className={`rank-badge ${
                            isTopOne
                              ? 'rank-1'
                              : isTopTwo
                              ? 'rank-2'
                              : isTopThree
                              ? 'rank-3'
                              : 'rank-other'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>

                      {/* Player Name & Dept */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300">
                            {row.player.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
                              <span>{row.player.name}</span>
                              {isTopOne && <Flame size={14} className="text-amber-400" />}
                            </div>
                            <div className="text-xs text-slate-400">{row.player.department}</div>
                          </div>
                        </div>
                      </td>

                      {/* Level Badge */}
                      <td className="text-center">
                        <span className={`badge-level-${row.player.level.toLowerCase()}`}>
                          Level {row.player.level}
                        </span>
                      </td>

                      {/* Played (M) */}
                      <td className="text-center font-semibold text-slate-300">{row.played}</td>

                      {/* Won (W) */}
                      <td className="text-center font-bold text-emerald-400">{row.won}</td>

                      {/* Lost (L) */}
                      <td className="text-center font-bold text-red-400">{row.lost}</td>

                      {/* Total Points (3 pts per win) */}
                      <td className="text-center">
                        <span className="font-extrabold text-base text-amber-300 font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {row.points}
                        </span>
                      </td>

                      {/* Points For (PF) */}
                      <td className="text-center text-xs font-mono text-slate-300">{row.pointsFor}</td>

                      {/* Points Against (PA) */}
                      <td className="text-center text-xs font-mono text-slate-400">{row.pointsAgainst}</td>

                      {/* Point Diff (+/-) */}
                      <td className="text-center font-mono font-bold text-xs">
                        <span
                          className={
                            row.pointDiff > 0
                              ? 'text-emerald-400'
                              : row.pointDiff < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }
                        >
                          {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="text-center font-semibold text-xs text-slate-300">
                        {row.winRate}%
                      </td>

                      {/* Recent Form (5 match badges) */}
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {row.recentForm.length === 0 ? (
                            <span className="text-[11px] text-slate-600">-</span>
                          ) : (
                            row.recentForm.map((result, idx) => (
                              <span
                                key={idx}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  result === 'W'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
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
      </div>

      {/* Rules Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="text-amber-400" size={20} />
                <span>Aturan Perhitungan Klasemen</span>
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
                  <li><strong>Menang:</strong> +3 Poin</li>
                  <li><strong>Kalah:</strong> 0 Poin</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="font-bold text-blue-400 text-sm mb-1">2. Urutan Penentuan Peringkat (Tie-Breaker):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li><strong>Total Poin Terbanyak</strong></li>
                  <li><strong>Jumlah Pertandingan Menang Terbanyak (W - L)</strong></li>
                  <li><strong>Selisih Skor Poin Terbesar (+/- Diff: PF - PA)</strong></li>
                  <li><strong>Total Poin Skor Masuk Terbanyak (PF)</strong></li>
                  <li><strong>Persentase Win Rate (%)</strong></li>
                </ol>
              </div>

              <div className="p-3 bg-slate-800/80 border border-white/10 rounded-xl">
                <p className="font-bold text-slate-200 text-sm mb-1">3. Level & Jaminan Main:</p>
                <p>Peserta dikategorikan <strong>Level A</strong> (kemampuan tinggi) dan <strong>Level B</strong>. Setiap peserta yang check-in dijamin main minimal 1x per hari sesi liga.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setShowRuleModal(false)} className="btn btn-primary btn-sm">
                Tutup & Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
