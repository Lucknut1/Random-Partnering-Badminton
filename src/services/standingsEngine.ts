import { Player, Match, StandingRow, Gender, SkillLevel } from '../types';

export interface StandingsFilter {
  leagueId?: string;
  seasonId?: string;
  gender: Gender;
  level?: SkillLevel | 'ALL';
  date?: string; // Optional for daily session standings
  eligiblePlayerIds?: Set<string>; // Peserta baru masuk klasemen setelah check-in
}

export const standingsEngine = {
  calculateStandings(
    players: Player[],
    matches: Match[],
    filter: StandingsFilter
  ): StandingRow[] {
    // 1. Filter players by league, gender, and level
    let filteredPlayers = players.filter((p) => p.gender === filter.gender);

    if (filter.eligiblePlayerIds) {
      filteredPlayers = filteredPlayers.filter((p) => filter.eligiblePlayerIds!.has(p.id));
    }

    if (filter.leagueId && filter.leagueId !== 'all') {
      filteredPlayers = filteredPlayers.filter(
        (p) => p.leagueId === filter.leagueId || p.leagueId === 'all'
      );
    }

    if (filter.level && filter.level !== 'ALL') {
      filteredPlayers = filteredPlayers.filter((p) => p.level === filter.level);
    }

    // 2. Filter completed matches
    // Data lama tanpa verificationStatus tetap dihitung. Hasil baru berstatus
    // PENDING baru masuk klasemen setelah host atau super admin memverifikasi.
    let relevantMatches = matches.filter(
      (m) => m.status === 'COMPLETED' && m.verificationStatus !== 'PENDING'
    );

    if (filter.leagueId && filter.leagueId !== 'all') {
      relevantMatches = relevantMatches.filter((m) => m.leagueId === filter.leagueId);
    }

    if (filter.seasonId && filter.seasonId !== 'all') {
      relevantMatches = relevantMatches.filter((m) => m.seasonId === filter.seasonId);
    }

    if (filter.date) {
      relevantMatches = relevantMatches.filter((m) => m.date === filter.date);
    }

    // Sort matches chronologically to calculate form
    relevantMatches.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.startedAt || '').localeCompare(b.startedAt || '');
    });

    // 3. Aggregate player stats
    const statsMap = new Map<string, {
      played: number;
      won: number;
      lost: number;
      pointsFor: number;
      pointsAgainst: number;
      form: ('W' | 'L')[];
    }>();

    // Initialize stats for each filtered player
    filteredPlayers.forEach((p) => {
      statsMap.set(p.id, {
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        form: [],
      });
    });

    // Calculate match results
    relevantMatches.forEach((match) => {
      const teamAPlayerIds = [match.teamA.player1Id, match.teamA.player2Id];
      const teamBPlayerIds = [match.teamB.player1Id, match.teamB.player2Id];

      const scoreA = match.teamA.score;
      const scoreB = match.teamB.score;

      const teamAWon = match.winnerTeam === 'teamA' || scoreA > scoreB;
      const teamBWon = match.winnerTeam === 'teamB' || scoreB > scoreA;

      // Update Team A Players
      teamAPlayerIds.forEach((pid) => {
        const stats = statsMap.get(pid);
        if (stats) {
          stats.played += 1;
          stats.pointsFor += scoreA;
          stats.pointsAgainst += scoreB;
          if (teamAWon) {
            stats.won += 1;
            stats.form.push('W');
          } else {
            stats.lost += 1;
            stats.form.push('L');
          }
        }
      });

      // Update Team B Players
      teamBPlayerIds.forEach((pid) => {
        const stats = statsMap.get(pid);
        if (stats) {
          stats.played += 1;
          stats.pointsFor += scoreB;
          stats.pointsAgainst += scoreA;
          if (teamBWon) {
            stats.won += 1;
            stats.form.push('W');
          } else {
            stats.lost += 1;
            stats.form.push('L');
          }
        }
      });
    });

    // 4. Transform to StandingRow array
    const standings: StandingRow[] = filteredPlayers.map((player) => {
      const stat = statsMap.get(player.id) || {
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        form: [],
      };

      const points = stat.won * 3; // Menang = 3 poin, Kalah = 0 poin
      const pointDiff = stat.pointsFor - stat.pointsAgainst;
      const winRate = stat.played > 0 ? Math.round((stat.won / stat.played) * 100) : 0;
      const recentForm = stat.form.slice(-5); // Ambil 5 pertandingan terakhir

      return {
        rank: 0, // Will be set after sorting
        player,
        played: stat.played,
        won: stat.won,
        lost: stat.lost,
        points,
        pointsFor: stat.pointsFor,
        pointsAgainst: stat.pointsAgainst,
        pointDiff,
        winRate,
        recentForm,
      };
    });

    // Urutan resmi: poin hasil (3/0), menang terbanyak, kalah paling sedikit,
    // selisih skor, lalu skor masuk.
    standings.sort((a, b) => {
      // 1. Poin Terbanyak
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // 2. Jumlah Menang Terbanyak
      if (b.won !== a.won) {
        return b.won - a.won;
      }
      if (a.lost !== b.lost) {
        return a.lost - b.lost;
      }
      // 4. Selisih Skor (+/-) Terbesar
      if (b.pointDiff !== a.pointDiff) {
        return b.pointDiff - a.pointDiff;
      }
      // 4. Skor Masuk Terbanyak (Points For)
      if (b.pointsFor !== a.pointsFor) {
        return b.pointsFor - a.pointsFor;
      }
      // 5. Win Rate
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      // 6. Alphabetical
      return a.player.name.localeCompare(b.player.name);
    });

    // 6. Assign official rank numbers (handling ties)
    let currentRank = 1;
    for (let i = 0; i < standings.length; i++) {
      if (i > 0) {
        const prev = standings[i - 1];
        const curr = standings[i];
        if (
          curr.points === prev.points &&
          curr.won === prev.won &&
          curr.lost === prev.lost &&
          curr.pointDiff === prev.pointDiff &&
          curr.pointsFor === prev.pointsFor
        ) {
          curr.rank = prev.rank;
        } else {
          curr.rank = i + 1;
        }
      } else {
        standings[i].rank = currentRank;
      }
    }

    return standings;
  },

  calculatePlayerStats(playerId: string, matches: Match[]): {
    totalMatches: number;
    won: number;
    lost: number;
    winRate: number;
    pointsScored: number;
    pointsConceded: number;
    points: number;
    diff: number;
  } {
    const playerMatches = matches.filter(
      (m) =>
        m.status === 'COMPLETED' &&
        m.verificationStatus !== 'PENDING' &&
        (m.teamA.player1Id === playerId ||
          m.teamA.player2Id === playerId ||
          m.teamB.player1Id === playerId ||
          m.teamB.player2Id === playerId)
    );

    let won = 0;
    let lost = 0;
    let pointsScored = 0;
    let pointsConceded = 0;

    playerMatches.forEach((m) => {
      const isTeamA = m.teamA.player1Id === playerId || m.teamA.player2Id === playerId;
      const myScore = isTeamA ? m.teamA.score : m.teamB.score;
      const opponentScore = isTeamA ? m.teamB.score : m.teamA.score;
      const isWin = isTeamA ? m.winnerTeam === 'teamA' : m.winnerTeam === 'teamB';

      pointsScored += myScore;
      pointsConceded += opponentScore;
      if (isWin) won++;
      else lost++;
    });

    const totalMatches = won + lost;
    return {
      totalMatches,
      won,
      lost,
      winRate: totalMatches > 0 ? Math.round((won / totalMatches) * 100) : 0,
      pointsScored,
      pointsConceded,
      points: won * 3,
      diff: pointsScored - pointsConceded,
    };
  },
};
