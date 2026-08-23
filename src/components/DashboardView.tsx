import React, { useState } from 'react';
import { Player, Match, League, CheckInRecord, Gender } from '../types';
import { standingsEngine } from '../services/standingsEngine';
import { formatLocalDateLong, getLocalDate } from '../services/dateService';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

interface DashboardViewProps {
  players: Player[];
  matches: Match[];
  activeLeague: League;
  checkIns: CheckInRecord[];
  onOpenRecordModal: () => void;
  onNavigateTab: (tab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  players,
  matches,
  activeLeague,
  checkIns,
  onOpenRecordModal,
  onNavigateTab,
}) => {
  const [topGender, setTopGender] = useState<Gender>('pria');
  const today = getLocalDate();
  const leaguePlayers = players.filter(
    (player) => player.leagueId === activeLeague.id || player.leagueId === 'all'
  );
  const todayCheckIns = checkIns.filter(
    (record) => record.date === today && record.leagueId === activeLeague.id
  );
  const checkedInPlayerIds = new Set(
    checkIns
      .filter((record) => record.leagueId === activeLeague.id)
      .map((record) => record.playerId)
  );
  const standings = standingsEngine.calculateStandings(players, matches, {
    leagueId: activeLeague.id,
    seasonId: activeLeague.activeSeasonId,
    gender: topGender,
    level: 'ALL',
    eligiblePlayerIds: checkedInPlayerIds,
  });
  const topPlayers = standings.slice(0, 5);
  const leagueMatches = matches.filter((match) => match.leagueId === activeLeague.id);
  const completedMatches = leagueMatches.filter((match) => match.status === 'COMPLETED');
  const activeMatches = leagueMatches.filter((match) => match.status === 'IN_PROGRESS');
  const recentMatches = [...completedMatches]
    .sort((a, b) => {
      const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateDifference || (b.completedAt || '').localeCompare(a.completedAt || '');
    })
    .slice(0, 4);
  const checkInProgress = leaguePlayers.length
    ? Math.min(100, Math.round((todayCheckIns.length / leaguePlayers.length) * 100))
    : 0;

  const getPlayerName = (id: string) => players.find((player) => player.id === id)?.name || 'Peserta';

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      <section className="event-hero">
        <div className="event-hero-content">
          <div className="event-kicker">
            <span className="live-dot" />
            MainBarengRaket
          </div>
          <h1>{activeLeague.name}</h1>
          <div className="event-meta">
            <span><CalendarDays size={14} /> {formatLocalDateLong()}</span>
            <span><MapPin size={14} /> {activeLeague.venue}</span>
            <span><Clock3 size={14} /> {activeLeague.startTime} sampai {activeLeague.endTime} WIB</span>
          </div>
          <p className="event-tagline">Satu raket, banyak partner, satu klasemen.</p>
          <p className="event-description">
            Kelola check-in, susun pasangan, catat skor, dan pantau klasemen dari satu pusat kompetisi.
          </p>
          <div className="event-actions">
            <button onClick={onOpenRecordModal} className="btn-record-hero">
              <Plus size={19} strokeWidth={3} />
              Catat skor pertandingan
            </button>
            <button onClick={() => onNavigateTab('players')} className="btn-action-secondary hero-secondary-action">
              <Users size={17} />
              Check-in peserta
            </button>
          </div>
        </div>

        <aside className="session-control" aria-label="Status sesi liga">
          <div className="session-control-header">
            <div>
              <span className="eyebrow">Status hari ini</span>
              <h2>Ruang pertandingan</h2>
            </div>
            <span className={activeMatches.length ? 'status-badge is-live' : 'status-badge'}>
              {activeMatches.length ? `${activeMatches.length} berlangsung` : 'Siap dimulai'}
            </span>
          </div>

          <div className="checkin-progress">
            <div className="progress-copy">
              <span>Peserta hadir</span>
              <strong>{todayCheckIns.length}/{leaguePlayers.length}</strong>
            </div>
            <div className="progress-track" aria-label={`Progres check-in ${checkInProgress}%`}>
              <span style={{ width: `${checkInProgress}%` }} />
            </div>
          </div>

          <div className="session-metrics">
            <div>
              <Activity size={17} />
              <span>Laga selesai</span>
              <strong>{completedMatches.length}</strong>
            </div>
            <div>
              <Users size={17} />
              <span>Total peserta</span>
              <strong>{leaguePlayers.length}</strong>
            </div>
          </div>

          <button onClick={() => onNavigateTab('matches')} className="session-link">
            Buka pusat pertandingan <ArrowRight size={15} />
          </button>
        </aside>
      </section>

      <section className="quick-action-grid" aria-label="Aksi cepat">
        <button onClick={() => onNavigateTab('players')} className="quick-action-card accent-green">
          <span className="quick-action-icon"><CheckCircle2 size={19} /></span>
          <span><strong>Check-in</strong><small>Daftarkan peserta hadir</small></span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigateTab('matches')} className="quick-action-card accent-orange">
          <span className="quick-action-icon"><Activity size={19} /></span>
          <span><strong>Pertandingan</strong><small>Pantau skor dan hasil</small></span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigateTab('ranking')} className="quick-action-card accent-cyan">
          <span className="quick-action-icon"><Trophy size={19} /></span>
          <span><strong>Klasemen</strong><small>Lihat posisi terbaru</small></span>
          <ArrowRight size={16} />
        </button>
      </section>

      <div className="dashboard-columns">
        <section className="competition-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Leaderboard</span>
              <h2><Trophy size={18} /> Peringkat teratas</h2>
            </div>
            <div className="segmented-control" aria-label="Pilih kategori gender">
              <button
                onClick={() => setTopGender('pria')}
                className={topGender === 'pria' ? 'active' : ''}
                aria-pressed={topGender === 'pria'}
              >
                Putra
              </button>
              <button
                onClick={() => setTopGender('wanita')}
                className={topGender === 'wanita' ? 'active cyan' : ''}
                aria-pressed={topGender === 'wanita'}
              >
                Putri
              </button>
            </div>
          </div>

          <div className="leaderboard-list">
            {topPlayers.length === 0 ? (
              <div className="empty-state">
                <Sparkles size={22} />
                <strong>Klasemen belum terbentuk</strong>
                <span>Peserta akan masuk setelah check-in dan bermain.</span>
              </div>
            ) : (
              topPlayers.map((row, index) => (
                <div key={row.player.id} className="leaderboard-row">
                  <span className={`rank-number rank-${Math.min(index + 1, 4)}`}>{index + 1}</span>
                  <div className="participant-avatar">{row.player.name.charAt(0)}</div>
                  <div className="participant-copy">
                    <strong>{row.player.name}</strong>
                    <span>{row.player.department} · Level {row.player.level}</span>
                  </div>
                  <div className="form-summary">
                    <span className="win-count">{row.won}M</span>
                    <span>{row.lost}K</span>
                  </div>
                  <div className="points-summary">
                    <strong>{row.points}</strong>
                    <span>poin</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => onNavigateTab('ranking')} className="panel-footer-action">
            Lihat klasemen lengkap <ArrowRight size={15} />
          </button>
        </section>

        <section className="competition-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Match center</span>
              <h2><Activity size={18} /> Hasil terbaru</h2>
            </div>
            <span className="panel-count">{completedMatches.length} laga</span>
          </div>

          <div className="match-feed">
            {recentMatches.length === 0 ? (
              <div className="empty-state">
                <Activity size={22} />
                <strong>Belum ada hasil pertandingan</strong>
                <span>Catat skor untuk menampilkan hasil pertama.</span>
              </div>
            ) : (
              recentMatches.map((match) => {
                const teamAWon = match.winnerTeam === 'teamA' || match.teamA.score > match.teamB.score;
                const teamBWon = match.winnerTeam === 'teamB' || match.teamB.score > match.teamA.score;
                return (
                  <article key={match.id} className="match-feed-card">
                    <div className="match-feed-meta">
                      <span>Lapangan {match.courtNumber}</span>
                      <span>{match.matchType === 'MD' ? 'Ganda Putra' : match.matchType === 'WD' ? 'Ganda Putri' : 'Ganda Campuran'}</span>
                      <span>{match.format === 'RACE_42' ? 'Race 42' : 'BWF 21'}</span>
                    </div>
                    <div className={teamAWon ? 'match-team winner' : 'match-team'}>
                      <span>{getPlayerName(match.teamA.player1Id)} & {getPlayerName(match.teamA.player2Id)}</span>
                      <strong>{match.teamA.score}</strong>
                    </div>
                    <div className={teamBWon ? 'match-team winner' : 'match-team'}>
                      <span>{getPlayerName(match.teamB.player1Id)} & {getPlayerName(match.teamB.player2Id)}</span>
                      <strong>{match.teamB.score}</strong>
                    </div>
                  </article>
                );
              })
            )}
          </div>
          <button onClick={() => onNavigateTab('matches')} className="panel-footer-action">
            Buka semua pertandingan <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </div>
  );
};
