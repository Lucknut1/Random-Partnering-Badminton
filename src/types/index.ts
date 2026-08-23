export type Gender = 'pria' | 'wanita';
export type SkillLevel = 'A' | 'B';
export type ScoreFormat = 'BWF' | 'RACE_42';
export type MatchType = 'MD' | 'WD' | 'XD'; // Ganda Putra, Ganda Putri, Ganda Campuran
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  level: SkillLevel;
  department: string;
  phone?: string;
  leagueId: string; // 'liga-melawai' | 'liga-ip' | 'all'
  avatar?: string;
  createdAt: string;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  isActive: boolean;
}

export interface League {
  id: string;
  name: string;
  venue: string;
  courtsCount: number;
  startTime: string; // e.g. "17:00"
  endTime: string;   // e.g. "20:00" or "21:00"
  defaultFormat: ScoreFormat;
  periodDurationMonths: number;
  seasons: Season[];
  activeSeasonId: string;
  description: string;
}

export interface CheckInRecord {
  id: string;
  playerId: string;
  leagueId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string;
  round: number; // 1 for first check-in, 2+ for re-check-in
  status: 'WAITING' | 'PLAYING' | 'PLAYED_1X' | 'READY_RECHECKIN';
  matchesPlayedToday: number;
}

export interface TeamInMatch {
  player1Id: string;
  player2Id: string;
  score: number;
  setsWon?: number;
}

export interface MatchSet {
  teamA: number;
  teamB: number;
}

export interface Match {
  id: string;
  leagueId: string;
  seasonId: string;
  date: string; // YYYY-MM-DD
  courtNumber: number;
  matchType: MatchType;
  format: ScoreFormat;
  teamA: TeamInMatch;
  teamB: TeamInMatch;
  setScores?: MatchSet[];
  status: MatchStatus;
  startedAt?: string;
  completedAt?: string;
  winnerTeam?: 'teamA' | 'teamB';
  currentServe?: 'teamA' | 'teamB';
  switchedSides?: boolean; // For Race 42 at 21 points
}

export interface StandingRow {
  rank: number;
  player: Player;
  played: number;        // M (Main)
  won: number;           // W (Menang)
  lost: number;          // L (Kalah)
  points: number;        // Poin (W * 3)
  pointsFor: number;     // PF (Poin Masuk)
  pointsAgainst: number; // PA (Poin Kebobolan)
  pointDiff: number;     // +/- Selisih Poin
  winRate: number;       // % Kemenangan
  recentForm: ('W' | 'L')[]; // 5 pertandingan terakhir
}
