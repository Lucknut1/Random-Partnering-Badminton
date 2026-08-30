import React, { useState } from 'react';
import {
  addMonthsToDateString,
  addMonthsToLocalDate,
  calculateDurationMonths,
  getLocalDate,
  isValidDateRange,
} from '../services/dateService';
import { Player, League, Season, Gender, SkillLevel, ScoreFormat } from '../types';
import { 
  Shield, 
  Users, 
  Trophy, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface AdminPanelProps {
  players: Player[];
  leagues: League[];
  activeLeague: League;
  onAddPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onAddLeague: (league: Omit<League, 'id'>) => void;
  onUpdateLeague: (league: League) => void;
  onDeleteLeague: (leagueId: string) => void;
  onAddSeason: (leagueId: string, season: Omit<Season, 'id'>) => void;
  onUpdateSeason: (leagueId: string, season: Season) => void;
  onSetActiveSeason: (leagueId: string, seasonId: string) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => boolean;
  onResetDatabase: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  players,
  leagues,
  activeLeague,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onAddLeague,
  onUpdateLeague,
  onDeleteLeague,
  onAddSeason,
  onUpdateSeason,
  onSetActiveSeason,
  onExportJSON,
  onImportJSON,
  onResetDatabase,
}) => {
  const [adminTab, setAdminTab] = useState<'players' | 'leagues' | 'seasons' | 'data'>('players');

  // Player Form State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [playerGender, setPlayerGender] = useState<Gender>('pria');
  const [playerLevel, setPlayerLevel] = useState<SkillLevel>('A');
  const [playerDept, setPlayerDept] = useState('');
  const [playerLeagueId, setPlayerLeagueId] = useState(activeLeague.id);
  const [playerSearch, setPlayerSearch] = useState('');

  // League Form State
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [leagueVenue, setLeagueVenue] = useState('');
  const [leagueCourts, setLeagueCourts] = useState(2);
  const [leagueStartTime, setLeagueStartTime] = useState('17:00');
  const [leagueEndTime, setLeagueEndTime] = useState('20:00');
  const [leagueDefaultFormat, setLeagueDefaultFormat] = useState<ScoreFormat>('RACE_42');
  const [leaguePeriodMonths, setLeaguePeriodMonths] = useState(1);
  const [leagueDesc, setLeagueDesc] = useState('');

  // Season Form State
  const [seasonName, setSeasonName] = useState('');
  const [seasonDuration, setSeasonDuration] = useState(1);
  const [seasonStart, setSeasonStart] = useState(getLocalDate());
  const [seasonEnd, setSeasonEnd] = useState('');
  const [seasonError, setSeasonError] = useState('');
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editSeasonName, setEditSeasonName] = useState('');
  const [editSeasonStart, setEditSeasonStart] = useState('');
  const [editSeasonEnd, setEditSeasonEnd] = useState('');

  // Handle Player Save
  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    if (editingPlayer) {
      onUpdatePlayer({
        ...editingPlayer,
        name: playerName.trim(),
        gender: playerGender,
        level: playerLevel,
        department: playerDept.trim() || 'Umum',
        leagueId: playerLeagueId,
      });
      setEditingPlayer(null);
    } else {
      onAddPlayer({
        name: playerName.trim(),
        gender: playerGender,
        level: playerLevel,
        department: playerDept.trim() || 'Umum',
        leagueId: playerLeagueId,
      });
    }

    setPlayerName('');
    setPlayerDept('');
  };

  const startEditPlayer = (p: Player) => {
    setEditingPlayer(p);
    setPlayerName(p.name);
    setPlayerGender(p.gender);
    setPlayerLevel(p.level);
    setPlayerDept(p.department);
    setPlayerLeagueId(p.leagueId);
  };

  const cancelEditPlayer = () => {
    setEditingPlayer(null);
    setPlayerName('');
    setPlayerDept('');
  };

  // Handle League Save
  const handleSaveLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) return;

    if (editingLeague) {
      onUpdateLeague({
        ...editingLeague,
        name: leagueName.trim(),
        venue: leagueVenue.trim() || 'GOR Badminton',
        courtsCount: Number(leagueCourts),
        startTime: leagueStartTime,
        endTime: leagueEndTime,
        defaultFormat: leagueDefaultFormat,
        periodDurationMonths: Number(leaguePeriodMonths),
        description: leagueDesc,
      });
      setEditingLeague(null);
    } else {
      const newSeasonId = `season-${Date.now()}`;
      onAddLeague({
        name: leagueName.trim(),
        venue: leagueVenue.trim() || 'GOR Badminton',
        courtsCount: Number(leagueCourts),
        startTime: leagueStartTime,
        endTime: leagueEndTime,
        defaultFormat: leagueDefaultFormat,
        periodDurationMonths: Number(leaguePeriodMonths),
        activeSeasonId: newSeasonId,
        seasons: [
          {
            id: newSeasonId,
            name: `Periode 1 (${leaguePeriodMonths} Bulan)`,
            startDate: getLocalDate(),
            endDate: addMonthsToLocalDate(leaguePeriodMonths),
            durationMonths: Number(leaguePeriodMonths),
            isActive: true,
          }
        ],
        description: leagueDesc,
      });
    }

    setLeagueName('');
    setLeagueVenue('');
    setLeagueDesc('');
  };

  const startEditLeague = (l: League) => {
    setEditingLeague(l);
    setLeagueName(l.name);
    setLeagueVenue(l.venue);
    setLeagueCourts(l.courtsCount);
    setLeagueStartTime(l.startTime);
    setLeagueEndTime(l.endTime);
    setLeagueDefaultFormat(l.defaultFormat);
    setLeaguePeriodMonths(l.periodDurationMonths);
    setLeagueDesc(l.description);
  };

  // Handle Season Add
  const handleAddSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonName.trim()) return;

    const resolvedEndDate = seasonEnd || addMonthsToDateString(seasonStart, seasonDuration);
    if (!isValidDateRange(seasonStart, resolvedEndDate)) {
      setSeasonError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    onAddSeason(activeLeague.id, {
      name: seasonName.trim(),
      startDate: seasonStart,
      endDate: resolvedEndDate,
      durationMonths: calculateDurationMonths(seasonStart, resolvedEndDate),
      isActive: false,
    });

    setSeasonName('');
    setSeasonEnd('');
    setSeasonError('');
  };

  const startEditSeason = (season: Season) => {
    setEditingSeason(season);
    setEditSeasonName(season.name);
    setEditSeasonStart(season.startDate);
    setEditSeasonEnd(season.endDate);
    setSeasonError('');
  };

  const cancelEditSeason = () => {
    setEditingSeason(null);
    setSeasonError('');
  };

  const handleUpdateSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeason || !editSeasonName.trim()) return;
    if (!isValidDateRange(editSeasonStart, editSeasonEnd)) {
      setSeasonError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    onUpdateSeason(activeLeague.id, {
      ...editingSeason,
      name: editSeasonName.trim(),
      startDate: editSeasonStart,
      endDate: editSeasonEnd,
      durationMonths: calculateDurationMonths(editSeasonStart, editSeasonEnd),
    });
    setEditingSeason(null);
    setSeasonError('');
  };

  // Handle File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = onImportJSON(content);
      if (success) {
        alert('Database berhasil diimpor!');
      } else {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  // Filtered players list
  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(playerSearch.toLowerCase()) || p.department.toLowerCase().includes(playerSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="clean-card p-5 bg-white border border-[#CBD5E1] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#EBF3FC] text-[#0B50A1] border border-[#BCD8F8]">
              PUSAT KONTROL ADMIN
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B50A1] font-['Outfit'] tracking-wider uppercase flex items-center gap-2.5">
            <Shield size={24} />
            <span>Super Admin Dashboard</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Kontrol data master peserta, konfigurasi 2 liga, batas waktu operasional, dan manajemen periode.
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xs border border-[#CBD5E1]">
          <button
            onClick={() => setAdminTab('players')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              adminTab === 'players' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
            }`}
          >
            <Users size={14} />
            <span>Peserta</span>
          </button>

          <button
            onClick={() => setAdminTab('leagues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              adminTab === 'leagues' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
            }`}
          >
            <Trophy size={14} />
            <span>Liga & Waktu</span>
          </button>

          <button
            onClick={() => setAdminTab('seasons')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              adminTab === 'seasons' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
            }`}
          >
            <Calendar size={14} />
            <span>Periode / Musim</span>
          </button>

          <button
            onClick={() => setAdminTab('data')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-black uppercase tracking-wider transition ${
              adminTab === 'data' ? 'bg-[#0B50A1] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B50A1] hover:bg-white'
            }`}
          >
            <Download size={14} />
            <span>Backup & Restore</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MANAJEMEN PESERTA */}
      {adminTab === 'players' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Tambah/Edit Peserta (5 Cols - Proportional) */}
          <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs lg:col-span-5 h-fit space-y-4">
            <div className="border-b border-[#E2E8F0] pb-2.5">
              <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase flex items-center gap-2">
                <Users className="text-[#0B50A1]" size={17} />
                <span>{editingPlayer ? 'Edit Data Peserta' : 'Tambah Peserta Baru'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {editingPlayer ? 'Perbarui data profil atlet terdaftar' : 'Daftarkan atlet baru ke dalam master database liga'}
              </p>
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Aris Wicaksono"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Jenis Kelamin</label>
                  <select
                    value={playerGender}
                    onChange={(e) => setPlayerGender(e.target.value as Gender)}
                    className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                  >
                    <option value="pria">Putra (Men)</option>
                    <option value="wanita">Putri (Women)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Level Permainan</label>
                  <select
                    value={playerLevel}
                    onChange={(e) => setPlayerLevel(e.target.value as SkillLevel)}
                    className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                  >
                    <option value="A">Level A (Tinggi)</option>
                    <option value="B">Level B (Menengah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Departemen / Divisi *</label>
                <input
                  type="text"
                  placeholder="Contoh: Divisi Transmisi / IP Operasi"
                  value={playerDept}
                  onChange={(e) => setPlayerDept(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Afiliasi Liga Utama</label>
                <select
                  value={playerLeagueId}
                  onChange={(e) => setPlayerLeagueId(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                >
                  <option value="all">Semua Liga</option>
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="submit" className="btn-yonex-action flex-1 py-2.5 text-xs font-black justify-center">
                  <Save size={14} />
                  <span>{editingPlayer ? 'Simpan Perubahan' : 'TAMBAH PESERTA'}</span>
                </button>
                {editingPlayer && (
                  <button
                    type="button"
                    onClick={cancelEditPlayer}
                    className="btn-yonex-outline py-2.5 text-xs font-bold"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Peserta (7 Cols - Dense & Proportional) */}
          <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
                  Daftar Peserta Master ({filteredPlayers.length} Pemain)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Database master seluruh pemain yang terdaftar</p>
              </div>
              <input
                type="text"
                placeholder="Cari nama atau departemen..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xs max-w-xs bg-white border-[#CBD5E1] text-[#0F172A]"
              />
            </div>

            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  Tidak ada peserta ditemukan dengan kata kunci pencarian tersebut.
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="p-3 bg-[#F8FAFC] rounded-xs border border-[#CBD5E1] flex items-center justify-between gap-3 hover:bg-[#F0F6FD] hover:border-[#BCD8F8] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xs font-black text-xs flex items-center justify-center ${
                        player.gender === 'pria' ? 'bg-[#EBF3FC] text-[#0B50A1]' : 'bg-[#EDF9F0] text-[#157327]'
                      }`}>
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-[#0F172A] text-xs flex items-center gap-2 uppercase">
                          <span>{player.name}</span>
                          <span className={`badge-lvl-${player.level.toLowerCase()} text-[10px]`}>
                            LVL {player.level}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-xs font-bold uppercase">
                            {player.gender === 'pria' ? 'Pria' : 'Wanita'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{player.department}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEditPlayer(player)}
                        className="p-1.5 rounded-xs bg-white border border-[#CBD5E1] text-slate-600 hover:text-[#0B50A1] hover:border-[#0B50A1] transition"
                        title="Edit Peserta"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus peserta ${player.name}?`)) {
                            onDeletePlayer(player.id);
                          }
                        }}
                        className="p-1.5 rounded-xs bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        title="Hapus Peserta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN LIGA & LIMIT WAKTU */}
      {adminTab === 'leagues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Tambah/Edit Liga (5 Cols) */}
          <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs lg:col-span-5 h-fit space-y-4">
            <div className="border-b border-[#E2E8F0] pb-2.5">
              <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase flex items-center gap-2">
                <Trophy className="text-[#0B50A1]" size={17} />
                <span>{editingLeague ? 'Edit Konfigurasi Liga' : 'Tambah Liga Baru'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Konfigurasi lokasi, kapasitas lapangan, dan jam main</p>
            </div>

            <form onSubmit={handleSaveLeague} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Nama Liga *</label>
                <input
                  type="text"
                  placeholder="Contoh: Liga Melawai - PLN Pusat"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Lokasi Venue *</label>
                <input
                  type="text"
                  placeholder="Contoh: GOR Bulutangkis Melawai"
                  value={leagueVenue}
                  onChange={(e) => setLeagueVenue(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Jumlah Lapangan</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={leagueCourts}
                    onChange={(e) => setLeagueCourts(Number(e.target.value))}
                    className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Format Skor Default</label>
                  <select
                    value={leagueDefaultFormat}
                    onChange={(e) => setLeagueDefaultFormat(e.target.value as ScoreFormat)}
                    className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                  >
                    <option value="RACE_42">Race to 42</option>
                    <option value="BWF">Standar 21 Poin</option>
                  </select>
                </div>
              </div>

              {/* Jam Operasional Limit Waktu */}
              <div className="p-3 bg-[#EDF9F0] rounded-xs border border-[#A3E3B1] space-y-2">
                <span className="text-xs font-black text-[#157327] flex items-center gap-1 uppercase tracking-wide">
                  <Clock size={13} /> Batas Jam Operasional Sesi (WIB):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-bold uppercase">Jam Mulai</label>
                    <input
                      type="time"
                      value={leagueStartTime}
                      onChange={(e) => setLeagueStartTime(e.target.value)}
                      className="w-full py-1.5 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-bold uppercase">Jam Selesai</label>
                    <input
                      type="time"
                      value={leagueEndTime}
                      onChange={(e) => setLeagueEndTime(e.target.value)}
                      className="w-full py-1.5 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Durasi Periode Default</label>
                <select
                  value={leaguePeriodMonths}
                  onChange={(e) => setLeaguePeriodMonths(Number(e.target.value))}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={2}>2 Bulan</option>
                  <option value={3}>3 Bulan (Triwulan)</option>
                  <option value={6}>6 Bulan (Semester)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="submit" className="btn-yonex-action flex-1 py-2.5 text-xs font-black justify-center">
                  <Save size={14} />
                  <span>{editingLeague ? 'Simpan Perubahan' : 'BUAT LIGA BARU'}</span>
                </button>
                {editingLeague && (
                  <button
                    type="button"
                    onClick={() => setEditingLeague(null)}
                    className="btn-yonex-outline py-2.5 text-xs font-bold"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Liga Aktif (7 Cols) */}
          <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs lg:col-span-7 space-y-4">
            <div className="border-b border-[#E2E8F0] pb-2.5">
              <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
                Daftar Liga Badminton Terdaftar ({leagues.length} Liga)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Liga aktif yang dikelola dalam aplikasi Mabarek</p>
            </div>

            <div className="space-y-3">
              {leagues.map((l) => (
                <div
                  key={l.id}
                  className="p-4 bg-[#F8FAFC] rounded-xs border border-[#CBD5E1] hover:border-[#0B50A1] transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-[#0F172A] text-sm flex items-center gap-2 uppercase">
                        <span>{l.name}</span>
                        {l.id === activeLeague.id && (
                          <span className="text-[10px] bg-[#EDF9F0] text-[#157327] px-2 py-0.5 rounded-xs font-black border border-[#A3E3B1]">
                            Liga Aktif
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{l.venue}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEditLeague(l)}
                        className="p-1.5 rounded-xs bg-white border border-[#CBD5E1] text-slate-600 hover:text-[#0B50A1] transition"
                        title="Edit Liga"
                      >
                        <Edit3 size={14} />
                      </button>
                      {leagues.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus liga ${l.name}?`)) {
                              onDeleteLeague(l.id);
                            }
                          }}
                          className="p-1.5 rounded-xs bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                          title="Hapus Liga"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xs border border-[#CBD5E1]">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Jam Sesi:</span>
                      <span className="font-bold text-[#0B50A1] font-mono">{l.startTime} - {l.endTime} WIB</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Lapangan:</span>
                      <span className="font-bold text-slate-800 font-mono">{l.courtsCount} Lapangan</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Format:</span>
                      <span className="font-bold text-[#157327] font-mono">{l.defaultFormat === 'RACE_42' ? 'Race 42' : 'Standar 21'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Periode:</span>
                      <span className="font-bold text-slate-800 font-mono">{l.periodDurationMonths} Bulan</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAJEMEN PERIODE / SEASONS */}
      {adminTab === 'seasons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Buat Periode (5 Cols) */}
          <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs lg:col-span-5 h-fit space-y-4">
            <div className="border-b border-[#E2E8F0] pb-2.5">
              <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase flex items-center gap-2">
                <Calendar className="text-[#0B50A1]" size={17} />
                <span>Buat Periode Liga Baru</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Tentukan rentang tanggal musim kompetisi</p>
            </div>

            <form onSubmit={handleAddSeasonSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Liga Target</label>
                <div className="p-2.5 bg-[#EBF3FC] rounded-xs text-xs font-black text-[#0B50A1] border border-[#BCD8F8]">
                  {activeLeague.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Nama Periode / Season *</label>
                <input
                  type="text"
                  placeholder="Contoh: Periode 2 - 2026 (Maret - April)"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Durasi Periode</label>
                <select
                  value={seasonDuration}
                  onChange={(e) => setSeasonDuration(Number(e.target.value))}
                  className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A] font-bold"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={2}>2 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>1 Tahun</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Tgl Mulai *</label>
                  <input
                    type="date"
                    value={seasonStart}
                    onChange={(e) => {
                      setSeasonStart(e.target.value);
                      setSeasonError('');
                    }}
                    className="w-full py-2 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Tgl Selesai *</label>
                  <input
                    type="date"
                    value={seasonEnd}
                    min={seasonStart}
                    onChange={(e) => {
                      setSeasonEnd(e.target.value);
                      setSeasonError('');
                    }}
                    className="w-full py-2 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-bold font-mono"
                  />
                </div>
              </div>

              {seasonError && !editingSeason && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xs border border-red-200" role="alert">{seasonError}</p>
              )}

              <button type="submit" className="btn-yonex-action w-full py-2.5 text-xs font-black justify-center">
                <Plus size={14} />
                <span>TAMBAH PERIODE BARU</span>
              </button>
            </form>
          </div>

          {/* List Periode (7 Cols) */}
          <div className="clean-card bg-white p-5 border border-[#CBD5E1] shadow-xs lg:col-span-7 space-y-4">
            <div className="border-b border-[#E2E8F0] pb-2.5">
              <h3 className="text-sm font-black text-[#0F172A] font-['Outfit'] uppercase">
                Kelola Periode Pelaksanaan {activeLeague.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Musim kompetisi aktif dan arsip periode sebelumnya</p>
            </div>

            <div className="space-y-3">
              {activeLeague.seasons.map((season) => {
                const isActive = season.id === activeLeague.activeSeasonId;
                return (
                  <div
                    key={season.id}
                    className={`p-4 rounded-xs border transition ${
                      isActive ? 'bg-[#FFFDF0] border-[#D4AF37] shadow-xs' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                  >
                    {editingSeason?.id === season.id ? (
                      <form onSubmit={handleUpdateSeasonSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Nama Periode:</label>
                          <input
                            type="text"
                            value={editSeasonName}
                            onChange={(e) => setEditSeasonName(e.target.value)}
                            className="w-full py-2 px-3 text-sm bg-white border-[#CBD5E1] text-[#0F172A]"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Tanggal Mulai:</label>
                            <input
                              type="date"
                              value={editSeasonStart}
                              onChange={(e) => {
                                setEditSeasonStart(e.target.value);
                                setSeasonError('');
                              }}
                              className="w-full py-1.5 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">Tanggal Selesai:</label>
                            <input
                              type="date"
                              value={editSeasonEnd}
                              min={editSeasonStart}
                              onChange={(e) => {
                                setEditSeasonEnd(e.target.value);
                                setSeasonError('');
                              }}
                              className="w-full py-1.5 px-2 text-xs bg-white border-[#CBD5E1] text-[#0F172A] font-mono font-bold"
                              required
                            />
                          </div>
                        </div>
                        {seasonError && (
                          <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xs border border-red-200" role="alert">{seasonError}</p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button type="submit" className="btn-yonex-action py-2 px-4 text-xs font-black">
                            <Save size={14} /> Simpan Periode
                          </button>
                          <button type="button" onClick={cancelEditSeason} className="btn-yonex-outline py-2 px-4 text-xs font-bold">
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-[#0F172A] text-sm uppercase">{season.name}</h4>
                            {isActive && (
                              <span className="text-[10px] bg-[#FFFDF0] text-[#B45309] px-2 py-0.5 rounded-xs font-black border border-[#D4AF37]">
                                Sedang Berjalan (Aktif)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1">
                            Rentang waktu: <strong>{season.startDate}</strong> s.d. <strong>{season.endDate}</strong> ({season.durationMonths} bulan)
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditSeason(season)}
                            className="btn-yonex-outline py-1.5 px-3 text-xs text-[#0B50A1]"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onSetActiveSeason(activeLeague.id, season.id)}
                              className="btn-yonex-action py-1.5 px-3 text-xs"
                            >
                              Jadikan Aktif
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP, RESTORE & RESET DATA */}
      {adminTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="clean-card bg-white p-6 border border-[#CBD5E1] space-y-4 shadow-xs">
            <h3 className="text-base font-black text-[#0F172A] font-['Outfit'] uppercase flex items-center gap-2">
              <Download className="text-[#157327]" size={20} />
              <span>Backup Data (Export JSON)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Download seluruh data peserta master, daftar liga, konfigurasi jam bermain, riwayat pertandingan, dan status check-in ke dalam format file JSON.
            </p>
            <button
              onClick={onExportJSON}
              className="btn-yonex-action py-3 px-5 text-xs font-black flex items-center gap-2"
            >
              <Download size={16} />
              <span>DOWNLOAD FILE BACKUP JSON</span>
            </button>
          </div>

          <div className="clean-card bg-white p-6 border border-[#CBD5E1] space-y-4 shadow-xs">
            <h3 className="text-base font-black text-[#0F172A] font-['Outfit'] uppercase flex items-center gap-2">
              <Upload className="text-[#0B50A1]" size={20} />
              <span>Restore Data (Import JSON)</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Pulihkan data sistem dari file backup JSON sebelumnya. Data yang ada akan diperbarui sesuai isi file.
            </p>
            <label className="btn-yonex-outline py-3 px-5 text-xs font-black inline-flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              <span>PILIH FILE BACKUP JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="clean-card p-6 border border-red-200 md:col-span-2 space-y-3 bg-red-50/60 shadow-xs">
            <h3 className="text-base font-black text-red-700 font-['Outfit'] uppercase flex items-center gap-2">
              <AlertTriangle size={20} />
              <span>Reset Data Demo Awal</span>
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Mengembalikan database ke data awal bawaan (Liga Melawai PLN Pusat & Liga Jumat Malam IP) dengan peserta default.
            </p>
            <button
              onClick={() => {
                if (confirm('PERINGATAN: Seluruh data hasil pertandingan dan check-in akan dikembalikan ke data awal demo. Lanjutkan?')) {
                  onResetDatabase();
                }
              }}
              className="btn-danger py-2.5 px-4 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>RESET DATABASE KE DEFAULT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
