import { Player, CheckInRecord, Match, MatchType, ScoreFormat, League } from '../types';

export interface MatchmakingOptions {
  league: League;
  date: string;
  courtsAvailable: number; // e.g. 2 or 3
  format: ScoreFormat;
  allowMixedDoubles: boolean; // Ganda Campuran
  remainingMinutes?: number;
}

export interface GeneratedMatchProposal {
  courtNumber: number;
  matchType: MatchType;
  format: ScoreFormat;
  teamA: {
    player1: Player;
    player2: Player;
  };
  teamB: {
    player1: Player;
    player2: Player;
  };
  balanceScore: string; // e.g., "Seimbang (A+B vs A+B)"
}

export const matchmakingEngine = {
  /**
   * Hitung perkiraan sisa waktu sesi liga dalam menit
   */
  calculateSessionTimeRemaining(league: League, currentTimeStr?: string): {
    totalDurationMinutes: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    isSessionActive: boolean;
    isSessionOver: boolean;
    hasTimeToPlayMore: boolean;
  } {
    const now = new Date();
    const currentHHMM = currentTimeStr || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const [startH, startM] = league.startTime.split(':').map(Number);
    const [endH, endM] = league.endTime.split(':').map(Number);
    const [currH, currM] = currentHHMM.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const currTotal = currH * 60 + currM;

    const totalDurationMinutes = Math.max(0, endTotal - startTotal);
    const elapsedMinutes = Math.max(0, Math.min(totalDurationMinutes, currTotal - startTotal));
    const remainingMinutes = Math.max(0, endTotal - currTotal);

    const isSessionActive = currTotal >= startTotal && currTotal < endTotal;
    const isSessionOver = currTotal >= endTotal;
    // Estimasi 1 pertandingan butuh minimal 20 menit
    const hasTimeToPlayMore = isSessionActive && remainingMinutes >= 20;

    return {
      totalDurationMinutes,
      elapsedMinutes,
      remainingMinutes,
      isSessionActive,
      isSessionOver,
      hasTimeToPlayMore,
    };
  },

  /**
   * Smart matchmaking algorithm prioritizing:
   * 1. Guaranteed >= 1 match per player today (matchesPlayedToday === 0)
   * 2. Ganda Putra (MD) & Ganda Putri (WD) first
   * 3. Level-balanced pairings (A+B vs A+B or A+A vs A+A)
   * 4. Ganda Campuran (XD) if remaining / leftover players or when allowed
   */
  generateMatchSchedule(
    allPlayers: Player[],
    checkIns: CheckInRecord[],
    currentMatches: Match[],
    options: MatchmakingOptions
  ): {
    proposals: GeneratedMatchProposal[];
    unmatchedPlayers: Player[];
    notes: string[];
  } {
    const today = options.date;
    const notes: string[] = [];

    // Pemain yang sedang bermain di lapangan (status IN_PROGRESS)
    const activePlayerIds = new Set<string>();
    currentMatches
      .filter((m) => m.date === today && (m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED'))
      .forEach((m) => {
        activePlayerIds.add(m.teamA.player1Id);
        activePlayerIds.add(m.teamA.player2Id);
        activePlayerIds.add(m.teamB.player1Id);
        activePlayerIds.add(m.teamB.player2Id);
      });

    // Ambil check-in hari ini untuk liga ini yang siap main
    const todayCheckIns = checkIns.filter(
      (c) => c.date === today && c.leagueId === options.league.id && !activePlayerIds.has(c.playerId)
    );

    // Map playerId to player object and check-in stats
    const eligiblePlayers: {
      player: Player;
      checkIn: CheckInRecord;
    }[] = [];

    todayCheckIns.forEach((c) => {
      const p = allPlayers.find((player) => player.id === c.playerId);
      if (p) {
        eligiblePlayers.push({ player: p, checkIn: c });
      }
    });

    // Prioritas 1: Urutkan yang belum main hari ini (matchesPlayedToday ASC), lalu waktu checkin
    eligiblePlayers.sort((a, b) => {
      if (a.checkIn.matchesPlayedToday !== b.checkIn.matchesPlayedToday) {
        return a.checkIn.matchesPlayedToday - b.checkIn.matchesPlayedToday;
      }
      return a.checkIn.checkInTime.localeCompare(b.checkIn.checkInTime);
    });

    const menPool = eligiblePlayers.filter((ep) => ep.player.gender === 'pria');
    const womenPool = eligiblePlayers.filter((ep) => ep.player.gender === 'wanita');

    const proposals: GeneratedMatchProposal[] = [];
    let currentCourt = 1;

    // Hitung poin kemenangan klasemen masing-masing pemain untuk penyeimbangan performa
    const playerPointsMap = new Map<string, number>();
    allPlayers.forEach((p) => {
      let pts = 0;
      currentMatches
        .filter((m) => m.leagueId === options.league.id && m.status === 'COMPLETED' && m.verificationStatus !== 'PENDING')
        .forEach((m) => {
          const teamAWon = m.winnerTeam === 'teamA' || m.teamA.score > m.teamB.score;
          const teamBWon = m.winnerTeam === 'teamB' || m.teamB.score > m.teamA.score;
          if ((m.teamA.player1Id === p.id || m.teamA.player2Id === p.id) && teamAWon) pts += 3;
          if ((m.teamB.player1Id === p.id || m.teamB.player2Id === p.id) && teamBWon) pts += 3;
        });
      playerPointsMap.set(p.id, pts);
    });

    const getPts = (player: Player) => playerPointsMap.get(player.id) || 0;

    // Helper untuk balance 4 pemain menjadi 2 tim seimbang
    const formBalancedTeams = (
      p1: Player,
      p2: Player,
      p3: Player,
      p4: Player
    ): { teamA: [Player, Player]; teamB: [Player, Player]; balanceLabel: string } => {
      const players = [p1, p2, p3, p4];
      const levelAPlayers = players.filter((p) => p.level === 'A');
      const levelBPlayers = players.filter((p) => p.level === 'B');

      // Kasus 1: 2 Level A & 2 Level B -> Silang A(Tertinggi)+B(Terendah) vs A(Terendah)+B(Tertinggi)
      if (levelAPlayers.length === 2 && levelBPlayers.length === 2) {
        levelAPlayers.sort((a, b) => getPts(b) - getPts(a));
        levelBPlayers.sort((a, b) => getPts(b) - getPts(a));
        return {
          teamA: [levelAPlayers[0], levelBPlayers[1]], // A Tertinggi + B Terendah
          teamB: [levelAPlayers[1], levelBPlayers[0]], // A Terendah + B Tertinggi
          balanceLabel: 'Sangat Seimbang (A+B vs A+B)',
        };
      }

      // Kasus 2: 4 Level A
      if (levelAPlayers.length === 4) {
        levelAPlayers.sort((a, b) => getPts(b) - getPts(a));
        return {
          teamA: [levelAPlayers[0], levelAPlayers[3]], // A1 + A4
          teamB: [levelAPlayers[1], levelAPlayers[2]], // A2 + A3
          balanceLabel: 'Level Tinggi (A+A vs A+A)',
        };
      }

      // Kasus 3: 4 Level B
      if (levelBPlayers.length === 4) {
        levelBPlayers.sort((a, b) => getPts(b) - getPts(a));
        return {
          teamA: [levelBPlayers[0], levelBPlayers[3]], // B1 + B4
          teamB: [levelBPlayers[1], levelBPlayers[2]], // B2 + B3
          balanceLabel: 'Level Merata (B+B vs B+B)',
        };
      }

      // Kasus 4: 3 Level A + 1 Level B -> Laga Tantangan
      // Aturan: Level A berpoin tertinggi dipasangkan dengan Level B melawan 2 Level A lainnya
      if (levelAPlayers.length === 3 && levelBPlayers.length === 1) {
        levelAPlayers.sort((a, b) => getPts(b) - getPts(a)); // Urutkan A tertinggi ke terendah
        const [aTop, aMid, aLow] = levelAPlayers;
        const [bPlayer] = levelBPlayers;

        return {
          teamA: [aTop, bPlayer],       // A Poin Tertinggi + Pemain B
          teamB: [aMid, aLow],          // 2 Pemain A Lawannya
          balanceLabel: 'Laga Tantangan (A_Top+B vs A+A)',
        };
      }

      // Kasus 5: 1 Level A + 3 Level B -> Laga Kombinasi
      // Aturan: Level A dipasangkan dengan Level B yang berpoin terendah melawan 2 Level B lainnya
      if (levelAPlayers.length === 1 && levelBPlayers.length === 3) {
        levelBPlayers.sort((a, b) => getPts(a) - getPts(b)); // Urutkan B terendah ke tertinggi
        const [aPlayer] = levelAPlayers;
        const [bLowest, bMid, bHigh] = levelBPlayers;

        return {
          teamA: [aPlayer, bLowest],    // Level A + Level B Poin Terendah
          teamB: [bMid, bHigh],         // 2 Level B Lawan yang Poinnya Lebih Tinggi
          balanceLabel: 'Laga Kombinasi (A+B_Low vs B+B)',
        };
      }

      // Fallback
      return {
        teamA: [players[0], players[1]],
        teamB: [players[2], players[3]],
        balanceLabel: 'Kombinasi Tim',
      };
    };

    // 1. PRIORITAS UTAMA: Ganda Putra (MD)
    while (menPool.length >= 4 && currentCourt <= options.courtsAvailable) {
      const p1 = menPool.shift()!.player;
      const p2 = menPool.shift()!.player;
      const p3 = menPool.shift()!.player;
      const p4 = menPool.shift()!.player;

      const balanced = formBalancedTeams(p1, p2, p3, p4);

      proposals.push({
        courtNumber: currentCourt++,
        matchType: 'MD',
        format: options.format,
        teamA: { player1: balanced.teamA[0], player2: balanced.teamA[1] },
        teamB: { player1: balanced.teamB[0], player2: balanced.teamB[1] },
        balanceScore: balanced.balanceLabel,
      });
    }

    // 2. PRIORITAS UTAMA: Ganda Putri (WD)
    while (womenPool.length >= 4 && currentCourt <= options.courtsAvailable) {
      const p1 = womenPool.shift()!.player;
      const p2 = womenPool.shift()!.player;
      const p3 = womenPool.shift()!.player;
      const p4 = womenPool.shift()!.player;

      const balanced = formBalancedTeams(p1, p2, p3, p4);

      proposals.push({
        courtNumber: currentCourt++,
        matchType: 'WD',
        format: options.format,
        teamA: { player1: balanced.teamA[0], player2: balanced.teamA[1] },
        teamB: { player1: balanced.teamB[0], player2: balanced.teamB[1] },
        balanceScore: balanced.balanceLabel,
      });
    }

    // 3. PRIORITAS KEDUA: Ganda Campuran (XD) jika ada sisa 2 pria & 2 wanita atau mode XD aktif
    const hasTimeForMixed = options.remainingMinutes === undefined || options.remainingMinutes >= 20;
    if (
      options.allowMixedDoubles &&
      hasTimeForMixed &&
      menPool.length >= 2 &&
      womenPool.length >= 2 &&
      currentCourt <= options.courtsAvailable
    ) {
      const m1 = menPool.shift()!.player;
      const m2 = menPool.shift()!.player;
      const w1 = womenPool.shift()!.player;
      const w2 = womenPool.shift()!.player;

      // Pair Man + Woman vs Man + Woman
      proposals.push({
        courtNumber: currentCourt++,
        matchType: 'XD',
        format: options.format,
        teamA: { player1: m1, player2: w1 },
        teamB: { player1: m2, player2: w2 },
        balanceScore: 'Ganda Campuran (Pria+Wanita vs Pria+Wanita)',
      });

      notes.push('Partai Ganda Campuran (XD) dibuat dari sisa antrean pemain.');
    }

    if (options.allowMixedDoubles && !hasTimeForMixed && menPool.length >= 2 && womenPool.length >= 2) {
      notes.push('Ganda Campuran ditunda karena sisa waktu kurang dari 20 menit.');
    }

    // Kumpulkan pemain yang belum mendapat slot di ronde ini
    const unmatchedPlayers = [...menPool.map((m) => m.player), ...womenPool.map((w) => w.player)];

    if (unmatchedPlayers.length > 0) {
      notes.push(
        `${unmatchedPlayers.length} pemain masuk antrean menunggu slot lapangan berikutnya.`
      );
    }

    return {
      proposals,
      unmatchedPlayers,
      notes,
    };
  },
};
