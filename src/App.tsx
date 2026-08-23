import React, { useEffect, useState } from 'react';
import { Player, League, Match, CheckInRecord, Season, ScoreFormat, MatchType } from './types';
import { storageService } from './services/storageService';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { RankingView } from './components/RankingView';
import { MatchHistoryView } from './components/MatchHistoryView';
import { PlayersView } from './components/PlayersView';
import { AdminPanel } from './components/AdminPanel';
import { RecordMatchModal } from './components/RecordMatchModal';
import { GeneratedMatchProposal, matchmakingEngine } from './services/matchmakingEngine';
import { matchRules } from './services/matchRules';
import { isSupabaseConfigured, supabase, supabaseService } from './services/supabaseService';
import { AdminLoginModal } from './components/AdminLoginModal';
import { getLocalDate } from './services/dateService';

const reconcileCheckIns = (records: CheckInRecord[], nextMatches: Match[]): CheckInRecord[] =>
  records.map((record) => {
    const played = nextMatches.filter(
      (match) =>
        match.status === 'COMPLETED' &&
        match.date === record.date &&
        match.leagueId === record.leagueId &&
        [match.teamA.player1Id, match.teamA.player2Id, match.teamB.player1Id, match.teamB.player2Id].includes(record.playerId)
    ).length;
    return {
      ...record,
      matchesPlayedToday: played,
      status: played > 0
        ? record.round > 1 ? 'READY_RECHECKIN' : 'PLAYED_1X'
        : 'WAITING',
    };
  });

export const App: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>(() => storageService.getLeagues());
  const [players, setPlayers] = useState<Player[]>(() => storageService.getPlayers());
  const [matches, setMatches] = useState<Match[]>(() => storageService.getMatches());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => storageService.getCheckIns());
  const [activeLeagueId, setActiveLeagueId] = useState<string>(() => storageService.getActiveLeagueId());
  
  // Navigation Tab: 'dashboard' | 'matches' | 'ranking' | 'players' | 'admin'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'ranking' | 'players' | 'admin'>('dashboard');
  
  // Record Match Modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => supabaseService.localAdminActive());
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>(
    isSupabaseConfigured ? 'syncing' : 'local'
  );

  // Active League object
  const activeLeague = leagues.find((l) => l.id === activeLeagueId) || leagues[0] || {
    id: 'liga-melawai',
    name: 'Liga Melawai - PLN Pusat',
    venue: 'GOR Bulutangkis Melawai',
    courtsCount: 3,
    startTime: '17:00',
    endTime: '20:00',
    defaultFormat: 'RACE_42',
    periodDurationMonths: 1,
    seasons: [],
    activeSeasonId: '',
    description: '',
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const session = await supabaseService.getSession();
        if (session && mounted) setIsAdmin(await supabaseService.isSuperAdmin(session.user.id));
        const snapshot = await supabaseService.loadSnapshot();
        if (snapshot && snapshot.leagues?.length && mounted) {
          setLeagues(snapshot.leagues);
          setPlayers(snapshot.players || []);
          setMatches(snapshot.matches || []);
          setCheckIns(snapshot.checkIns || []);
          storageService.saveLeagues(snapshot.leagues);
          storageService.savePlayers(snapshot.players || []);
          storageService.saveMatches(snapshot.matches || []);
          storageService.saveCheckIns(snapshot.checkIns || []);
        }
        if (mounted) setCloudStatus(isSupabaseConfigured ? 'synced' : 'local');
      } catch (error) {
        console.error('Supabase initialization failed:', error);
        if (mounted) setCloudStatus('error');
      } finally {
        if (mounted) setCloudReady(true);
      }
    };
    initialize();
    const { data: authListener } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      setIsAdmin(session ? await supabaseService.isSuperAdmin(session.user.id) : false);
    }) || { data: { subscription: null } };
    return () => {
      mounted = false;
      authListener.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!cloudReady || !isSupabaseConfigured || !isAdmin) return;
    setCloudStatus('syncing');
    const timer = window.setTimeout(async () => {
      try {
        await supabaseService.saveSnapshot({ leagues, players, matches, checkIns });
        setCloudStatus('synced');
      } catch (error) {
        console.error('Supabase synchronization failed:', error);
        setCloudStatus('error');
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [leagues, players, matches, checkIns, cloudReady, isAdmin]);

  const openAdmin = () => {
    if (isAdmin) setActiveTab('admin');
    else setIsAdminLoginOpen(true);
  };

  const handleSelectLeague = (id: string) => {
    setActiveLeagueId(id);
    storageService.setActiveLeagueId(id);
  };

  // CHECK-IN HANDLERS
  const handleAddCheckIn = (playerId: string, round = 1) => {
    const today = getLocalDate();
    const nowHHMM = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (round >= 2) {
      const timeInfo = matchmakingEngine.calculateSessionTimeRemaining(activeLeague);
      const existing = checkIns.find(
        (c) => c.playerId === playerId && c.date === today && c.leagueId === activeLeague.id
      );
      if (!existing || existing.matchesPlayedToday < 1 || !timeInfo.hasTimeToPlayMore) {
        alert('Check-in ulang hanya tersedia setelah bermain minimal 1x dan sisa waktu minimal 20 menit.');
        return;
      }
    }

    const existingIndex = checkIns.findIndex(
      (c) => c.playerId === playerId && c.date === today && c.leagueId === activeLeague.id
    );

    let updated: CheckInRecord[];
    if (existingIndex >= 0) {
      updated = [...checkIns];
      updated[existingIndex] = {
        ...updated[existingIndex],
        round: round,
        checkInTime: nowHHMM,
        status: round >= 2 ? 'READY_RECHECKIN' : updated[existingIndex].status,
      };
    } else {
      const newCheckIn: CheckInRecord = {
        id: `cin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        playerId,
        leagueId: activeLeague.id,
        date: today,
        checkInTime: nowHHMM,
        round,
        status: 'WAITING',
        matchesPlayedToday: 0,
      };
      updated = [newCheckIn, ...checkIns];
    }

    setCheckIns(updated);
    storageService.saveCheckIns(updated);
  };

  const handleRemoveCheckIn = (checkInId: string) => {
    const updated = checkIns.filter((c) => c.id !== checkInId);
    setCheckIns(updated);
    storageService.saveCheckIns(updated);
  };

  const handleBulkCheckIn = (playerIds: string[]) => {
    const today = getLocalDate();
    const nowHHMM = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecords: CheckInRecord[] = [];
    const currentMap = new Map<string, CheckInRecord>();
    checkIns.forEach((c) => {
      if (c.date === today && c.leagueId === activeLeague.id) {
        currentMap.set(c.playerId, c);
      }
    });

    playerIds.forEach((pid) => {
      if (!currentMap.has(pid)) {
        newRecords.push({
          id: `cin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          playerId: pid,
          leagueId: activeLeague.id,
          date: today,
          checkInTime: nowHHMM,
          round: 1,
          status: 'WAITING',
          matchesPlayedToday: 0,
        });
      }
    });

    const updated = [...newRecords, ...checkIns];
    setCheckIns(updated);
    storageService.saveCheckIns(updated);
  };

  // RECORD MATCH HANDLERS
  const handleSaveQuickMatch = (data: {
    courtNumber: number;
    matchType: MatchType;
    format: ScoreFormat;
    player1A: string;
    player2A: string;
    player1B: string;
    player2B: string;
    scoreA: number;
    scoreB: number;
  }): boolean => {
    const today = getLocalDate();
    const checkedInPlayerIds = new Set(
      checkIns
        .filter((record) => record.date === today && record.leagueId === activeLeague.id)
        .map((record) => record.playerId)
    );
    const lineupValidation = matchRules.validateLineup(
      data.matchType,
      [data.player1A, data.player2A, data.player1B, data.player2B],
      players,
      checkedInPlayerIds
    );
    const scoreValidation = matchRules.validateScore(data.format, data.scoreA, data.scoreB);
    if (!lineupValidation.valid || !scoreValidation.valid) {
      alert(lineupValidation.message || scoreValidation.message);
      return false;
    }
    const nowHHMM = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const winnerTeam: 'teamA' | 'teamB' = data.scoreA > data.scoreB ? 'teamA' : 'teamB';

    const newMatch: Match = {
      id: `m-${Date.now()}`,
      leagueId: activeLeague.id,
      seasonId: activeLeague.activeSeasonId,
      date: today,
      courtNumber: data.courtNumber,
      matchType: data.matchType,
      format: data.format,
      teamA: {
        player1Id: data.player1A,
        player2Id: data.player2A,
        score: data.scoreA,
      },
      teamB: {
        player1Id: data.player1B,
        player2Id: data.player2B,
        score: data.scoreB,
      },
      status: 'COMPLETED',
      startedAt: nowHHMM,
      completedAt: nowHHMM,
      winnerTeam,
    };

    const updatedMatches = [newMatch, ...matches];
    setMatches(updatedMatches);
    storageService.saveMatches(updatedMatches);

    const updatedCheckIns = reconcileCheckIns(checkIns, updatedMatches);

    setCheckIns(updatedCheckIns);
    storageService.saveCheckIns(updatedCheckIns);
    return true;
  };

  const handleStartGeneratedMatches = (proposals: GeneratedMatchProposal[]) => {
    const today = getLocalDate();
    const nowHHMM = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMatches: Match[] = proposals.map((p, idx) => ({
      id: `match-${Date.now()}-${idx}`,
      leagueId: activeLeague.id,
      seasonId: activeLeague.activeSeasonId,
      date: today,
      courtNumber: p.courtNumber,
      matchType: p.matchType,
      format: p.format,
      teamA: {
        player1Id: p.teamA.player1.id,
        player2Id: p.teamA.player2.id,
        score: 0,
      },
      teamB: {
        player1Id: p.teamB.player1.id,
        player2Id: p.teamB.player2.id,
        score: 0,
      },
      status: 'IN_PROGRESS',
      startedAt: nowHHMM,
      currentServe: 'teamA',
      switchedSides: false,
    }));

    const updatedMatches = [...newMatches, ...matches];
    setMatches(updatedMatches);
    storageService.saveMatches(updatedMatches);
    setActiveTab('matches');
  };

  const handleDeleteMatch = (matchId: string) => {
    const updated = matches.filter((m) => m.id !== matchId);
    setMatches(updated);
    storageService.saveMatches(updated);
    const updatedCheckIns = reconcileCheckIns(checkIns, updated);
    setCheckIns(updatedCheckIns);
    storageService.saveCheckIns(updatedCheckIns);
  };

  const handleUpdateScore = (matchId: string, teamAScore: number, teamBScore: number, switchedSides?: boolean) => {
    const updated = matches.map((match) => match.id === matchId ? {
      ...match,
      teamA: { ...match.teamA, score: teamAScore },
      teamB: { ...match.teamB, score: teamBScore },
      switchedSides: switchedSides ?? match.switchedSides,
    } : match);
    setMatches(updated);
    storageService.saveMatches(updated);
  };

  const handleFinishMatch = (matchId: string, winnerTeam: 'teamA' | 'teamB') => {
    const target = matches.find((match) => match.id === matchId);
    if (!target) return;
    const validation = matchRules.validateScore(target.format, target.teamA.score, target.teamB.score);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    const updated = matches.map((match) => match.id === matchId ? {
      ...match,
      status: 'COMPLETED' as const,
      winnerTeam,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    } : match);
    setMatches(updated);
    storageService.saveMatches(updated);
    const updatedCheckIns = reconcileCheckIns(checkIns, updated);
    setCheckIns(updatedCheckIns);
    storageService.saveCheckIns(updatedCheckIns);
  };

  const handleCancelMatch = (matchId: string) => {
    const updated = matches.map((match) => match.id === matchId ? { ...match, status: 'CANCELLED' as const } : match);
    setMatches(updated);
    storageService.saveMatches(updated);
  };

  // ADMIN HANDLERS
  const handleAddPlayer = (playerData: Omit<Player, 'id' | 'createdAt'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: `p-${Date.now()}`,
      createdAt: getLocalDate(),
    };
    const updated = [...players, newPlayer];
    setPlayers(updated);
    storageService.savePlayers(updated);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    const updated = players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p));
    setPlayers(updated);
    storageService.savePlayers(updated);
  };

  const handleDeletePlayer = (playerId: string) => {
    const updated = players.filter((p) => p.id !== playerId);
    setPlayers(updated);
    storageService.savePlayers(updated);
    const updatedCheckIns = checkIns.filter((record) => record.playerId !== playerId);
    setCheckIns(updatedCheckIns);
    storageService.saveCheckIns(updatedCheckIns);
  };

  const handleAddLeague = (leagueData: Omit<League, 'id'>) => {
    const newLeague: League = {
      ...leagueData,
      id: `liga-${Date.now()}`,
    };
    const updated = [...leagues, newLeague];
    setLeagues(updated);
    storageService.saveLeagues(updated);
    setActiveLeagueId(newLeague.id);
  };

  const handleUpdateLeague = (updatedLeague: League) => {
    const updated = leagues.map((l) => (l.id === updatedLeague.id ? updatedLeague : l));
    setLeagues(updated);
    storageService.saveLeagues(updated);
  };

  const handleDeleteLeague = (leagueId: string) => {
    const updated = leagues.filter((l) => l.id !== leagueId);
    setLeagues(updated);
    storageService.saveLeagues(updated);
    const updatedPlayers = players.filter((player) => player.leagueId !== leagueId);
    const updatedMatches = matches.filter((match) => match.leagueId !== leagueId);
    const updatedCheckIns = checkIns.filter((record) => record.leagueId !== leagueId);
    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    setCheckIns(updatedCheckIns);
    storageService.savePlayers(updatedPlayers);
    storageService.saveMatches(updatedMatches);
    storageService.saveCheckIns(updatedCheckIns);
    if (activeLeagueId === leagueId && updated.length > 0) {
      setActiveLeagueId(updated[0].id);
      storageService.setActiveLeagueId(updated[0].id);
    }
  };

  const handleAddSeason = (leagueId: string, seasonData: Omit<Season, 'id'>) => {
    const newSeason: Season = {
      ...seasonData,
      id: `season-${Date.now()}`,
    };
    const updatedLeagues = leagues.map((l) => {
      if (l.id === leagueId) {
        return {
          ...l,
          seasons: [...l.seasons, newSeason],
        };
      }
      return l;
    });
    setLeagues(updatedLeagues);
    storageService.saveLeagues(updatedLeagues);
  };

  const handleSetActiveSeason = (leagueId: string, seasonId: string) => {
    const updatedLeagues = leagues.map((l) => {
      if (l.id === leagueId) {
        const updatedSeasons = l.seasons.map((s) => ({
          ...s,
          isActive: s.id === seasonId,
        }));
        return {
          ...l,
          seasons: updatedSeasons,
          activeSeasonId: seasonId,
        };
      }
      return l;
    });
    setLeagues(updatedLeagues);
    storageService.saveLeagues(updatedLeagues);
  };

  const handleExportJSON = () => {
    const json = storageService.exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShuttleRank_Backup_${getLocalDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (jsonStr: string) => {
    const success = storageService.importDatabaseJSON(jsonStr);
    if (success) {
      setLeagues(storageService.getLeagues());
      setPlayers(storageService.getPlayers());
      setMatches(storageService.getMatches());
      setCheckIns(storageService.getCheckIns());
      setActiveLeagueId(storageService.getActiveLeagueId());
    }
    return success;
  };

  const handleResetDatabase = () => {
    storageService.resetToDefault();
    setLeagues(storageService.getLeagues());
    setPlayers(storageService.getPlayers());
    setMatches(storageService.getMatches());
    setCheckIns(storageService.getCheckIns());
    setActiveLeagueId('liga-melawai');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 pb-20 md:pb-6">
      {/* Top Navbar & Mobile Bottom Navigation */}
      <Navigation
        leagues={leagues}
        activeLeague={activeLeague}
        onSelectLeague={handleSelectLeague}
        activeTab={activeTab}
        onSelectTab={(tab) => tab === 'admin' ? openAdmin() : setActiveTab(tab)}
        onOpenRecordModal={() => setIsRecordModalOpen(true)}
        isAdmin={isAdmin}
        cloudStatus={cloudStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5">
        {activeTab === 'dashboard' && (
          <DashboardView
            players={players}
            matches={matches}
            activeLeague={activeLeague}
            checkIns={checkIns}
            onOpenRecordModal={() => setIsRecordModalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'ranking' && (
          <RankingView
            players={players}
            matches={matches}
            activeLeague={activeLeague}
            checkIns={checkIns}
          />
        )}

        {activeTab === 'matches' && (
          <MatchHistoryView
            matches={matches}
            players={players}
            activeLeague={activeLeague}
            onDeleteMatch={handleDeleteMatch}
            onUpdateScore={handleUpdateScore}
            onFinishMatch={handleFinishMatch}
            onCancelMatch={handleCancelMatch}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'players' && (
          <PlayersView
            players={players}
            checkIns={checkIns}
            activeLeague={activeLeague}
            matches={matches}
            onAddPlayer={handleAddPlayer}
            onAddCheckIn={handleAddCheckIn}
            onRemoveCheckIn={handleRemoveCheckIn}
            onBulkCheckIn={handleBulkCheckIn}
            canManage={isAdmin}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            players={players}
            leagues={leagues}
            activeLeague={activeLeague}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onAddLeague={handleAddLeague}
            onUpdateLeague={handleUpdateLeague}
            onDeleteLeague={handleDeleteLeague}
            onAddSeason={handleAddSeason}
            onSetActiveSeason={handleSetActiveSeason}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* Record Match Modal (Quick Input / Live Referee / Auto Pair) */}
      <RecordMatchModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        players={players}
        activeLeague={activeLeague}
        checkIns={checkIns}
        matches={matches}
        onSaveQuickMatch={handleSaveQuickMatch}
        onStartGeneratedMatches={handleStartGeneratedMatches}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onAuthenticated={() => {
          setIsAdmin(true);
          setActiveTab('admin');
        }}
      />
    </div>
  );
};

export default App;
