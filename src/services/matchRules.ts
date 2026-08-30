import { MatchType, Player, ScoreFormat } from '../types';

export interface MatchValidationResult {
  valid: boolean;
  message?: string;
}

export const matchRules = {
  validateScore(format: ScoreFormat, scoreA: number, scoreB: number): MatchValidationResult {
    if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
      return { valid: false, message: 'Skor harus berupa bilangan bulat positif.' };
    }
    if (scoreA === scoreB) {
      return { valid: false, message: 'Pertandingan tidak boleh berakhir seri.' };
    }

    const winner = Math.max(scoreA, scoreB);
    const loser = Math.min(scoreA, scoreB);
    if (format === 'RACE_42') {
      return winner === 42 && loser <= 41
        ? { valid: true }
        : { valid: false, message: 'Race 42 selesai saat pemenang tepat mencapai 42 poin.' };
    }

    const regularWin = winner >= 21 && winner <= 29 && winner - loser >= 2;
    const cappedWin = winner === 30 && loser <= 29;
    return regularWin || cappedWin
      ? { valid: true }
      : { valid: false, message: 'Skor standar harus selisih 2 poin mulai 21, dengan batas maksimal 30 poin.' };
  },

  validateLineup(
    matchType: MatchType,
    playerIds: string[],
    players: Player[],
    checkedInPlayerIds: Set<string>
  ): MatchValidationResult {
    if (playerIds.some((id) => !id)) {
      return { valid: false, message: 'Pilih empat pemain terlebih dahulu.' };
    }
    if (new Set(playerIds).size !== 4) {
      return { valid: false, message: 'Setiap posisi harus diisi pemain yang berbeda.' };
    }
    if (playerIds.some((id) => !checkedInPlayerIds.has(id))) {
      return { valid: false, message: 'Semua pemain wajib check-in sebelum bertanding.' };
    }

    const selected = playerIds.map((id) => players.find((player) => player.id === id));
    if (selected.some((player) => !player)) {
      return { valid: false, message: 'Data pemain tidak ditemukan.' };
    }

    const genders = selected.map((player) => player!.gender);
    if (matchType === 'MD' && genders.some((gender) => gender !== 'pria')) {
      return { valid: false, message: 'Ganda Putra harus terdiri dari empat pemain pria.' };
    }
    if (matchType === 'WD' && genders.some((gender) => gender !== 'wanita')) {
      return { valid: false, message: 'Ganda Putri harus terdiri dari empat pemain wanita.' };
    }
    if (matchType === 'XD' && (genders[0] === genders[1] || genders[2] === genders[3])) {
      return { valid: false, message: 'Setiap tim Ganda Campuran harus berisi satu pria dan satu wanita.' };
    }

    return { valid: true };
  },
};
