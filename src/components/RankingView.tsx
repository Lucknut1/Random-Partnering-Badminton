import React from 'react';
import { Player, Match, League, CheckInRecord } from '../types';
import { StandingsTable } from './StandingsTable';

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
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <StandingsTable
        players={players}
        matches={matches}
        activeLeague={activeLeague}
      />
    </div>
  );
};

export default RankingView;
