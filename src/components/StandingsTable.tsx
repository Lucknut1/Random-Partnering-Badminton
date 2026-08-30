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
  HelpCircle,
  Award,
  ChevronRight,
  Shield,
  Clock,
  Sparkles
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
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* 1. YONEX STRUCTURAL HEADER & CATEGORY TABS */}
      <div className="clean-card p-4 sm:p-5 bg-white border border-[#CBD5E1] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
                SISTEM RANKING RESMI
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Pembaruan: {getLocalDate()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B50A1] font-['Outfit'] tracking-wider uppercase">
              KLASEMEN & PERINGKAT TURNAMEN
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Liga: <strong className="text-[#0F172A]">{activeLeague.name}</strong> • 3 Poin per Kemenangan (W)
            </p>
          </div>

          {/* Category Tabs (Yonex Blue Theme) */}
          <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xs border border-[#CBD5E1] self-start lg:self-auto">
            <button
              onClick={() => setSelectedGender('pria')}
              className={`px-4 py-2 rounded-xs text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                selectedGender === 'pria'
                  ? 'bg-[#0B50A1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
              }`}
            >
              <Users size={14} />
              <span>GANDA PUTRA</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-black/20 font-mono">
                {countGender('pria')}
              </span>
            </button>

            <button
              onClick={() => setSelectedGender('wanita')}
              className={`px-4 py-2 rounded-xs text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                selectedGender === 'wanita'
                  ? 'bg-[#0B50A1] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
              }`}
            >
              <Users size={14} />
              <span>GANDA PUTRI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-black/20 font-mono">
                {countGender('wanita')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP 3 PODIUM (YONEX 3-TIER COLORED CARDS) */}
      <PodiumCard topThree={topThree} gender={selectedGender} />

      {/* 3. FILTER & SEARCH CONTROLS BAR */}
      <div className="clean-card p-3 sm:p-4 bg-white border border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Cari atlet atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xs w-full bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0B50A1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xs border border-[#CBD5E1] text-xs">
            <span className="text-[10px] text-slate-500 px-1.5 font-bold uppercase tracking-wider">Level:</span>
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-2.5 py-1 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                selectedLevel === 'ALL' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
              }`}
            >
              SEMUA
            </button>
            <button
              onClick={() => setSelectedLevel('A')}
              className={`px-2.5 py-1 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                selectedLevel === 'A' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
              }`}
            >
              LVL A
            </button>
            <button
              onClick={() => setSelectedLevel('B')}
              className={`px-2.5 py-1 rounded-xs text-xs font-black uppercase tracking-wider transition ${
                selectedLevel === 'B' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1]'
              }`}
            >
              LVL B
            </button>
          </div>

          {/* Season / Week Selector */}
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
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
            className="btn-yonex-outline text-xs py-1.5 px-3"
            title="Download CSV Ranking"
          >
            <Download size={13} className="text-[#0B50A1]" />
            <span className="hidden sm:inline">EXPORT CSV</span>
          </button>

          {/* Rules Modal Button */}
          <button
            onClick={() => setShowRuleModal(true)}
            className="p-1.5 text-slate-500 hover:text-[#0B50A1] rounded-xs hover:bg-[#F1F5F9] transition"
            title="Aturan Perhitungan Poin"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* 4. YONEX STANDINGS TABLE (PRECISION MECHANICAL TABLE WITH 3-TIER HIGHLIGHTS) */}
      <div className="yonex-table-wrapper">
        <table className="yonex-table">
          <thead>
            <tr>
              <th className="w-16 text-center">RANK</th>
              <th>NAMA ATLET / DEPARTEMEN</th>
              <th className="text-center">LEVEL</th>
              <th className="text-center" title="Matches Played">MATCHES</th>
              <th className="text-center" title="Won - Lost">WIN - LOSS</th>
              <th className="text-center text-[#0B50A1]" title="Total Ranking Points">POINTS</th>
              <th className="text-center" title="Points For / Points Against">PF / PA</th>
              <th className="text-center" title="Score Differential">DIFF</th>
              <th className="text-center" title="Win Rate Percentage">WIN RATE</th>
              <th className="text-center">FORM (5 LAGA)</th>
            </tr>
          </thead>
          <tbody>
            {filteredStandings.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-slate-500 text-sm font-medium">
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
                        ? 'yonex-row-rank-1'
                        : isRank2
                        ? 'yonex-row-rank-2'
                        : isRank3
                        ? 'yonex-row-rank-3'
                        : ''
                    }
                  >
                    {/* Rank Number Box (Yonex 3-Tier Palette: Gold, Blue, Green, Standard) */}
                    <td className="text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span
                          className={`rank-badge-box ${
                            isRank1
                              ? 'rank-box-gold'
                              : isRank2
                              ? 'rank-box-blue'
                              : isRank3
                              ? 'rank-box-green'
                              : 'rank-box-standard'
                          }`}
                        >
                          {row.rank}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          {isRank1 ? 'JUARA 1' : isRank2 ? 'RUNNER-UP' : isRank3 ? 'POSISI 3' : `POS ${row.rank}`}
                        </span>
                      </div>
                    </td>

                    {/* Athlete Name & Department */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xs font-black text-xs flex items-center justify-center ${
                          row.player.gender === 'pria' ? 'bg-[#EBF3FC] text-[#0B50A1]' : 'bg-[#EDF9F0] text-[#157327]'
                        }`}>
                          {row.player.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-[#0F172A] text-xs uppercase flex items-center gap-1.5">
                            <span>{row.player.name}</span>
                            {isRank1 && <Trophy size={12} className="text-[#D4AF37] inline fill-[#D4AF37]" />}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {row.player.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="text-center">
                      <span className={`badge-lvl-${row.player.level.toLowerCase()}`}>
                        LVL {row.player.level}
                      </span>
                    </td>

                    {/* Matches Played */}
                    <td className="text-center font-mono font-bold text-slate-700 text-xs tabular-nums">
                      {row.played}
                    </td>

                    {/* Win - Loss Record & Bar */}
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-xs font-bold tabular-nums">
                          <strong className="text-[#157327]">{row.won}W</strong> - <strong className="text-red-600">{row.lost}L</strong>
                        </span>
                        {totalWL > 0 && (
                          <div className="yonex-wl-bar">
                            <div
                              className="yonex-wl-bar-win"
                              style={{ width: `${winPercent}%` }}
                            />
                            <div
                              className="yonex-wl-bar-loss"
                              style={{ width: `${100 - winPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Ranking Points */}
                    <td className="text-center">
                      <span className="yonex-points-cell">
                        <span className="tabular-nums">{row.points}</span>
                        <span className="text-[9px] font-bold text-[#0B50A1]">PTS</span>
                      </span>
                    </td>

                    {/* Points For / Points Against (Tabular) */}
                    <td className="text-center text-xs font-mono text-slate-700 tabular-nums">
                      <span>{row.pointsFor}</span> / <span className="text-slate-500">{row.pointsAgainst}</span>
                    </td>

                    {/* Score Differential (+/-) */}
                    <td className="text-center font-mono font-bold text-xs tabular-nums">
                      <span
                        className={
                          row.pointDiff > 0
                            ? 'text-[#157327]'
                            : row.pointDiff < 0
                            ? 'text-red-600'
                            : 'text-slate-500'
                        }
                      >
                        {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                      </span>
                    </td>

                    {/* Win Rate Percentage */}
                    <td className="text-center font-mono font-extrabold text-xs tabular-nums">
                      <span
                        className={`px-2 py-0.5 rounded-xs ${
                          row.winRate >= 70
                            ? 'bg-[#EDF9F0] text-[#157327] border border-[#A3E3B1]'
                            : row.winRate >= 50
                            ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.winRate}%
                      </span>
                    </td>

                    {/* Recent Form (5 Laga) */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.recentForm.length === 0 ? (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        ) : (
                          row.recentForm.map((result, idx) => (
                            <span
                              key={idx}
                              className={`yonex-form-tag ${
                                result === 'W' ? 'yonex-form-w' : 'yonex-form-l'
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="clean-card max-w-lg w-full p-6 space-y-4 border-[#CBD5E1] shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-black text-[#0B50A1] flex items-center gap-2 font-['Outfit'] uppercase">
                <Trophy className="text-[#D4AF37]" size={20} />
                <span>Aturan Perhitungan Ranking Turnamen</span>
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-[#EDF9F0] border border-[#A3E3B1] rounded-xs">
                <p className="font-bold text-[#157327] text-sm mb-1 uppercase">1. Sistem Poin Pertandingan:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Menang (Win):</strong> +3 Poin</li>
                  <li><strong>Kalah (Loss):</strong> 0 Poin</li>
                </ul>
              </div>

              <div className="p-3 bg-[#EBF3FC] border border-[#BCD8F8] rounded-xs">
                <p className="font-bold text-[#0B50A1] text-sm mb-1 uppercase">2. Urutan Penentuan Ranking (Tie-Breaker):</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>Total Ranking Points (PTS)</strong></li>
                  <li><strong>Jumlah Kemenangan Terbanyak (W)</strong></li>
                  <li><strong>Selisih Skor Poin (+/- Diff: PF - PA)</strong></li>
                  <li><strong>Total Poin Skor Masuk (PF)</strong></li>
                  <li><strong>Persentase Win Rate (%)</strong></li>
                </ol>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs">
                <p className="font-bold text-[#0F172A] text-sm mb-1 uppercase">3. Kesetaraan Level Fair Play:</p>
                <p>Peserta dikelompokkan ke <strong>Level A</strong> dan <strong>Level B</strong> untuk memastikan kesetaraan pertandingan dan perolehan poin yang kompetitif.</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => setShowRuleModal(false)} className="btn-yonex-action">
                Tutup & Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandingsTable;
