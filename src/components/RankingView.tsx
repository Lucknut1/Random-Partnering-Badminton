import React, { useState } from 'react';
import { Player, Match, League, Gender, SkillLevel, CheckInRecord } from '../types';
import { standingsEngine } from '../services/standingsEngine';
import { Trophy, Search, Download, Users } from 'lucide-react';

interface RankingViewProps {
  players: Player[];
  matches: Match[];
  activeLeague: League;
  checkIns: CheckInRecord[];
}

export const RankingView: React.FC<RankingViewProps> = ({
  players,
  matches,
  activeLeague,
  checkIns,
}) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('pria');
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(activeLeague.activeSeasonId || 'all');

  const checkedInPlayerIds = new Set(
    checkIns
      .filter((record) => record.leagueId === activeLeague.id)
      .map((record) => record.playerId)
  );

  const standings = standingsEngine.calculateStandings(players, matches, {
    leagueId: activeLeague.id,
    seasonId: selectedSeasonId,
    gender: selectedGender,
    level: selectedLevel,
    eligiblePlayerIds: checkedInPlayerIds,
  });

  const filteredStandings = standings.filter(
    (row) =>
      row.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.player.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Pos', 'Nama', 'Gender', 'Level', 'Departemen', 'Main', 'Menang', 'Kalah', 'Poin', 'Skor Masuk (PF)', 'Skor Kebobolan (PA)', 'Selisih (+/-)', 'Win Rate (%)'];
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
    link.setAttribute('download', `Ranking_${activeLeague.name}_${selectedGender}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Title & Gender Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-['Outfit']">
            <Trophy className="text-amber-400" size={22} />
            <span>Ranking & Klasemen</span>
          </h1>
          <p className="text-xs text-slate-400">
            {activeLeague.name} • Menang = 3 Poin
          </p>
        </div>

        {/* Gender Toggle */}
        <div className="flex items-center gap-1 bg-[#131a26] p-1 rounded-lg border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setSelectedGender('pria')}
            className={`px-3.5 py-1.5 rounded text-xs font-bold transition ${
              selectedGender === 'pria' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kategori Putra
          </button>
          <button
            onClick={() => setSelectedGender('wanita')}
            className={`px-3.5 py-1.5 rounded text-xs font-bold transition ${
              selectedGender === 'wanita' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kategori Putri
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="clean-card p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari pemain / departemen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center bg-[#151d2a] p-0.5 rounded-lg border border-white/5 text-xs">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                selectedLevel === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedLevel('A')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                selectedLevel === 'A' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              Lvl A
            </button>
            <button
              onClick={() => setSelectedLevel('B')}
              className={`px-2 py-1 rounded text-[11px] font-bold ${
                selectedLevel === 'B' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400'
              }`}
            >
              Lvl B
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="btn-action-secondary text-xs py-1.5 px-2.5"
            title="Download CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="clean-card overflow-hidden">
        <div className="clean-table-container">
          <table className="clean-table">
            <thead>
              <tr>
                <th className="w-12 text-center">POS</th>
                <th>PESERTA</th>
                <th className="text-center">LVL</th>
                <th className="text-center" title="Main">M</th>
                <th className="text-center text-emerald-400" title="Menang">W</th>
                <th className="text-center text-red-400" title="Kalah">L</th>
                <th className="text-center text-emerald-400 font-extrabold" title="Poin (3 per menang)">PTS</th>
                <th className="text-center" title="Skor Masuk">PF</th>
                <th className="text-center" title="Skor Kebobolan">PA</th>
                <th className="text-center font-bold" title="Selisih">+/-</th>
                <th className="text-center" title="Win Rate %">WIN%</th>
              </tr>
            </thead>
            <tbody>
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-xs text-slate-500">
                    Belum ada peserta yang check-in pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredStandings.map((row) => (
                  <tr key={row.player.id}>
                    <td className="text-center">
                      <span
                        className={`pos-circle ${
                          row.rank === 1 && row.points > 0
                            ? 'pos-1'
                            : row.rank === 2 && row.points > 0
                            ? 'pos-2'
                            : row.rank === 3 && row.points > 0
                            ? 'pos-3'
                            : 'pos-other'
                        }`}
                      >
                        {row.rank}
                      </span>
                    </td>

                    <td>
                      <div>
                        <div className="font-extrabold text-white text-sm">
                          {row.player.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {row.player.department}
                        </div>
                      </div>
                    </td>

                    <td className="text-center">
                      <span className={`badge-lvl-${row.player.level.toLowerCase()}`}>
                        {row.player.level}
                      </span>
                    </td>

                    <td className="text-center font-semibold text-slate-300 mono-num">{row.played}</td>
                    <td className="text-center font-bold text-emerald-400 mono-num">{row.won}</td>
                    <td className="text-center font-bold text-red-400 mono-num">{row.lost}</td>

                    <td className="text-center font-black text-sm text-emerald-400 mono-num">
                      {row.points}
                    </td>

                    <td className="text-center text-xs text-slate-400 mono-num">{row.pointsFor}</td>
                    <td className="text-center text-xs text-slate-400 mono-num">{row.pointsAgainst}</td>

                    <td className="text-center text-xs font-bold mono-num">
                      <span className={row.pointDiff > 0 ? 'text-emerald-400' : row.pointDiff < 0 ? 'text-red-400' : 'text-slate-400'}>
                        {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                      </span>
                    </td>

                    <td className="text-center text-xs text-slate-300 mono-num">{row.winRate}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
