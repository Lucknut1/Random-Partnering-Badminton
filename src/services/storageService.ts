import { Player, League, Match, CheckInRecord } from '../types';
import { getLocalDate } from './dateService';

const STORAGE_KEYS = {
  LEAGUES: 'shuttlerank_leagues_v1',
  PLAYERS: 'shuttlerank_players_v1',
  MATCHES: 'shuttlerank_matches_v1',
  CHECKINS: 'shuttlerank_checkins_v1',
  ACTIVE_LEAGUE_ID: 'shuttlerank_active_league_id_v1',
};

export const INITIAL_LEAGUES: League[] = [
  {
    id: 'liga-melawai',
    name: 'Liga Melawai - PLN Pusat',
    venue: 'GOR Bulutangkis Melawai (3 Lapangan)',
    courtsCount: 3,
    startTime: '17:00',
    endTime: '20:00',
    defaultFormat: 'RACE_42',
    periodDurationMonths: 1,
    seasons: [
      {
        id: 'season-melawai-2026-1',
        name: 'Periode 1 - 2026 (Januari - Februari)',
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        durationMonths: 2,
        isActive: true,
      },
      {
        id: 'season-melawai-2026-2',
        name: 'Periode 2 - 2026 (Maret - April)',
        startDate: '2026-03-01',
        endDate: '2026-04-30',
        durationMonths: 2,
        isActive: false,
      }
    ],
    activeSeasonId: 'season-melawai-2026-1',
    description: 'Liga rutin karyawan PLN Kantor Pusat setiap sesi sore 17:00 - 20:00 WIB di GOR Melawai.',
  },
  {
    id: 'liga-ip',
    name: 'Liga Jumat Malam di IP',
    venue: 'IP Sport Hall Arena (2 Lapangan)',
    courtsCount: 2,
    startTime: '17:00',
    endTime: '21:00',
    defaultFormat: 'BWF',
    periodDurationMonths: 2,
    seasons: [
      {
        id: 'season-ip-2026-1',
        name: 'Periode 1 - 2026 (Januari - Maret)',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        durationMonths: 3,
        isActive: true,
      }
    ],
    activeSeasonId: 'season-ip-2026-1',
    description: 'Liga badminton komunitas Jumat Malam di IP Arena jam 17:00 - 21:00 WIB.',
  }
];

export const INITIAL_PLAYERS: Player[] = [
  // Liga Melawai - PLN Pusat: Pria Level A
  { id: 'p1', name: 'Aris Wicaksono', gender: 'pria', level: 'A', department: 'Divisi Transmisi', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p2', name: 'Dwi Prasetya', gender: 'pria', level: 'A', department: 'Divisi Enjiniring', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p3', name: 'Bambang Sudibyo', gender: 'pria', level: 'A', department: 'Divisi Operasi', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p4', name: 'Reza Gunawan', gender: 'pria', level: 'A', department: 'Divisi Niaga', leagueId: 'liga-melawai', createdAt: '2026-01-10' },

  // Liga Melawai - PLN Pusat: Pria Level B
  { id: 'p5', name: 'Hendra Saputra', gender: 'pria', level: 'B', department: 'Keuangan & Akuntansi', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p6', name: 'Yoga Pratama', gender: 'pria', level: 'B', department: 'Manajemen SDM', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p7', name: 'Arief Kurniawan', gender: 'pria', level: 'B', department: 'Teknologi Informasi', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p8', name: 'Fikri Haikal', gender: 'pria', level: 'B', department: 'Sekretariat Perusahaan', leagueId: 'liga-melawai', createdAt: '2026-01-10' },

  // Liga Melawai - PLN Pusat: Wanita Level A
  { id: 'p9', name: 'Siti Rahmawati', gender: 'wanita', level: 'A', department: 'Hukum & Kepatuhan', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p10', name: 'Nadia Safitri', gender: 'wanita', level: 'A', department: 'Divisi Enjiniring', leagueId: 'liga-melawai', createdAt: '2026-01-10' },

  // Liga Melawai - PLN Pusat: Wanita Level B
  { id: 'p11', name: 'Rina Kusuma', gender: 'wanita', level: 'B', department: 'Komunikasi Korporat', leagueId: 'liga-melawai', createdAt: '2026-01-10' },
  { id: 'p12', name: 'Dian Permatasari', gender: 'wanita', level: 'B', department: 'Pelayanan Pelanggan', leagueId: 'liga-melawai', createdAt: '2026-01-10' },

  // Liga Jumat Malam di IP: Pria Level A
  { id: 'p13', name: 'Fajar Nugroho', gender: 'pria', level: 'A', department: 'IP Operasi 1', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p14', name: 'Daniel Hartono', gender: 'pria', level: 'A', department: 'IP Pemeliharaan', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p15', name: 'Taufik Hidayatullah', gender: 'pria', level: 'A', department: 'IP Enjiniring', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p16', name: 'Budi Santoso IP', gender: 'pria', level: 'A', department: 'IP Niaga & Bisnis', leagueId: 'liga-ip', createdAt: '2026-01-10' },

  // Liga Jumat Malam di IP: Pria Level B
  { id: 'p17', name: 'Gilang Ramadhan', gender: 'pria', level: 'B', department: 'IP Logistik', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p18', name: 'Wawan Setiawan', gender: 'pria', level: 'B', department: 'IP Keuangan', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p19', name: 'Bayu Anggoro', gender: 'pria', level: 'B', department: 'IP K3 & Lingkungan', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p20', name: 'Rizky Firmansyah', gender: 'pria', level: 'B', department: 'IP Admin Office', leagueId: 'liga-ip', createdAt: '2026-01-10' },

  // Liga Jumat Malam di IP: Wanita Level A
  { id: 'p21', name: 'Indah Puspita', gender: 'wanita', level: 'A', department: 'IP Finance', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p22', name: 'Mega Utami', gender: 'wanita', level: 'A', department: 'IP Commercial', leagueId: 'liga-ip', createdAt: '2026-01-10' },

  // Liga Jumat Malam di IP: Wanita Level B
  { id: 'p23', name: 'Citra Amelia', gender: 'wanita', level: 'B', department: 'IP Legal', leagueId: 'liga-ip', createdAt: '2026-01-10' },
  { id: 'p24', name: 'Tari Anindya', gender: 'wanita', level: 'B', department: 'IP HR & General', leagueId: 'liga-ip', createdAt: '2026-01-10' },
];

export const INITIAL_MATCHES: Match[] = [
  // Contoh Match Selesai Liga Melawai (Race 42)
  {
    id: 'm1',
    leagueId: 'liga-melawai',
    seasonId: 'season-melawai-2026-1',
    date: getLocalDate(),
    courtNumber: 1,
    matchType: 'MD',
    format: 'RACE_42',
    teamA: { player1Id: 'p1', player2Id: 'p5', score: 42 }, // Aris (A) & Hendra (B)
    teamB: { player1Id: 'p2', player2Id: 'p6', score: 38 }, // Dwi (A) & Yoga (B)
    status: 'COMPLETED',
    startedAt: '17:15',
    completedAt: '17:42',
    winnerTeam: 'teamA',
    switchedSides: true,
  },
  {
    id: 'm2',
    leagueId: 'liga-melawai',
    seasonId: 'season-melawai-2026-1',
    date: getLocalDate(),
    courtNumber: 2,
    matchType: 'MD',
    format: 'RACE_42',
    teamA: { player1Id: 'p3', player2Id: 'p7', score: 35 }, // Bambang (A) & Arief (B)
    teamB: { player1Id: 'p4', player2Id: 'p8', score: 42 }, // Reza (A) & Fikri (B)
    status: 'COMPLETED',
    startedAt: '17:15',
    completedAt: '17:45',
    winnerTeam: 'teamB',
    switchedSides: true,
  },
  {
    id: 'm3',
    leagueId: 'liga-melawai',
    seasonId: 'season-melawai-2026-1',
    date: getLocalDate(),
    courtNumber: 3,
    matchType: 'WD',
    format: 'RACE_42',
    teamA: { player1Id: 'p9', player2Id: 'p11', score: 42 }, // Siti (A) & Rina (B)
    teamB: { player1Id: 'p10', player2Id: 'p12', score: 39 }, // Nadia (A) & Dian (B)
    status: 'COMPLETED',
    startedAt: '17:20',
    completedAt: '17:50',
    winnerTeam: 'teamA',
    switchedSides: true,
  }
];

export const storageService = {
  getLeagues(): League[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEAGUES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(INITIAL_LEAGUES));
      return INITIAL_LEAGUES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_LEAGUES;
    }
  },

  saveLeagues(leagues: League[]): void {
    localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(leagues));
  },

  getPlayers(): Player[] {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
      return INITIAL_PLAYERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PLAYERS;
    }
  },

  savePlayers(players: Player[]): void {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  getMatches(): Match[] {
    const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
      return INITIAL_MATCHES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MATCHES;
    }
  },

  saveMatches(matches: Match[]): void {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  },

  getCheckIns(): CheckInRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    if (!data) {
      const today = getLocalDate();
      const initialCheckIns: CheckInRecord[] = [
        { id: 'c1', playerId: 'p1', leagueId: 'liga-melawai', date: today, checkInTime: '16:55', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c2', playerId: 'p2', leagueId: 'liga-melawai', date: today, checkInTime: '16:55', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c3', playerId: 'p3', leagueId: 'liga-melawai', date: today, checkInTime: '16:56', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c4', playerId: 'p4', leagueId: 'liga-melawai', date: today, checkInTime: '16:58', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c5', playerId: 'p5', leagueId: 'liga-melawai', date: today, checkInTime: '16:59', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c6', playerId: 'p6', leagueId: 'liga-melawai', date: today, checkInTime: '17:00', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c7', playerId: 'p7', leagueId: 'liga-melawai', date: today, checkInTime: '17:02', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c8', playerId: 'p8', leagueId: 'liga-melawai', date: today, checkInTime: '17:03', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c9', playerId: 'p9', leagueId: 'liga-melawai', date: today, checkInTime: '17:05', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c10', playerId: 'p10', leagueId: 'liga-melawai', date: today, checkInTime: '17:05', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c11', playerId: 'p11', leagueId: 'liga-melawai', date: today, checkInTime: '17:08', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
        { id: 'c12', playerId: 'p12', leagueId: 'liga-melawai', date: today, checkInTime: '17:10', round: 1, status: 'PLAYED_1X', matchesPlayedToday: 1 },
      ];
      localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(initialCheckIns));
      return initialCheckIns;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveCheckIns(checkIns: CheckInRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkIns));
  },

  getActiveLeagueId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_LEAGUE_ID) || 'liga-melawai';
  },

  setActiveLeagueId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LEAGUE_ID, id);
  },

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.LEAGUES, JSON.stringify(INITIAL_LEAGUES));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
    localStorage.removeItem(STORAGE_KEYS.CHECKINS);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LEAGUE_ID, 'liga-melawai');
  },

  exportDatabaseJSON(): string {
    const data = {
      leagues: this.getLeagues(),
      players: this.getPlayers(),
      matches: this.getMatches(),
      checkIns: this.getCheckIns(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importDatabaseJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        console.error('Import error: Payload must be a non-null object');
        return false;
      }

      // Validasi array leagues
      if (!Array.isArray(data.leagues) || data.leagues.length === 0) return false;
      const isValidLeague = (l: unknown): l is League => {
        if (!l || typeof l !== 'object') return false;
        const item = l as Partial<League>;
        return (
          typeof item.id === 'string' &&
          Boolean(item.id.trim()) &&
          typeof item.name === 'string' &&
          typeof item.venue === 'string' &&
          typeof item.courtsCount === 'number' &&
          item.courtsCount > 0 &&
          ['BWF', 'RACE_42'].includes(item.defaultFormat || '') &&
          Array.isArray(item.seasons)
        );
      };
      if (!data.leagues.every(isValidLeague)) {
        console.error('Import error: Invalid leagues structure');
        return false;
      }

      // Validasi array players
      if (!Array.isArray(data.players)) return false;
      const isValidPlayer = (p: unknown): p is Player => {
        if (!p || typeof p !== 'object') return false;
        const item = p as Partial<Player>;
        return (
          typeof item.id === 'string' &&
          Boolean(item.id.trim()) &&
          typeof item.name === 'string' &&
          ['pria', 'wanita'].includes(item.gender || '') &&
          ['A', 'B'].includes(item.level || '') &&
          typeof item.department === 'string' &&
          typeof item.leagueId === 'string'
        );
      };
      if (!data.players.every(isValidPlayer)) {
        console.error('Import error: Invalid players structure');
        return false;
      }

      // Validasi array matches
      if (!Array.isArray(data.matches)) return false;
      const isValidMatch = (m: unknown): m is Match => {
        if (!m || typeof m !== 'object') return false;
        const item = m as Partial<Match>;
        return (
          typeof item.id === 'string' &&
          typeof item.leagueId === 'string' &&
          typeof item.date === 'string' &&
          typeof item.courtNumber === 'number' &&
          ['MD', 'WD', 'XD'].includes(item.matchType || '') &&
          ['BWF', 'RACE_42'].includes(item.format || '') &&
          Boolean(item.teamA && typeof item.teamA === 'object' && typeof item.teamA.score === 'number') &&
          Boolean(item.teamB && typeof item.teamB === 'object' && typeof item.teamB.score === 'number') &&
          ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(item.status || '')
        );
      };
      if (!data.matches.every(isValidMatch)) {
        console.error('Import error: Invalid matches structure');
        return false;
      }

      // Validasi checkIns jika tersedia
      if (data.checkIns !== undefined) {
        if (!Array.isArray(data.checkIns)) return false;
        const isValidCheckIn = (c: unknown): c is CheckInRecord => {
          if (!c || typeof c !== 'object') return false;
          const item = c as Partial<CheckInRecord>;
          return (
            typeof item.id === 'string' &&
            typeof item.playerId === 'string' &&
            typeof item.leagueId === 'string' &&
            typeof item.date === 'string' &&
            typeof item.round === 'number'
          );
        };
        if (!data.checkIns.every(isValidCheckIn)) {
          console.error('Import error: Invalid checkIns structure');
          return false;
        }
      }

      this.saveLeagues(data.leagues);
      this.savePlayers(data.players);
      this.saveMatches(data.matches);
      if (data.checkIns) this.saveCheckIns(data.checkIns);
      return true;
    } catch (e) {
      console.error('Import validation error:', e);
      return false;
    }
  }
};
