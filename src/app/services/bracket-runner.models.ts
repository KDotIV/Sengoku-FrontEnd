// Mirrors SengokuProvider.Library/Models/Players and Models/Leagues/PlayerOnboardResult.
export interface PlayerStandingResult {
  standingDetails: {
    isActive: boolean;
    placement: number;
    leaguePoints: number;
    gamerTag: string | null;
    eventId: number;
    eventName: string | null;
    tournamentId: number;
    tournamentName: string | null;
  };
  leaugeId: number; // Spelling matches the backend contract.
  tournamentLinks: { playerLinkId: number; playerId: number; entrantId: number; standingId: number };
  entrantsNum: number;
  response: string | null;
  urlSlug: string | null;
  lastUpdated: string;
}

export interface PlayerTournamentCard {
  playerID: number;
  playerName: string;
  entrantID: number;
  playerResults: PlayerStandingResult[];
}

export interface EntrantSetCard {
  entrantOneID: number;
  playerOneID: number;
  entrantOneName: string;
  entrantTwoID: number;
  playerTwoID: number;
  entrantTwoName: string;
  setID: string;
  pathStep: number | null;
  pathSetId: string | null;
  matchStatus: string;
}

export interface BracketVictoryPathData {
  bracketPathId: number;
  bracketId: number | null;
  playerStartggLink: number;
  tournamentSlug: string | null;
  startTime: string | null;
  endTime: string | null;
  lifecycle: 'Upcoming' | 'InProgress' | 'Completed' | 'Unknown';
  tournamentLinkID: number;
  eventLinkID: number;
  tournamentName: string;
  roundNum: string;
  playerTournamentCard: PlayerTournamentCard;
  entrantSetCards: EntrantSetCard[];
}

export interface PlayerOnboardResult {
  successful: string[];
  failures: string[];
  response: string;
  operationId: string | null;
  status: 'Pending' | 'Completed' | 'Failed' | 'Expired' | null;
}

export function isPending(result: PlayerOnboardResult): boolean {
  return result.status === 'Pending' && !result.response.startsWith('FAILED:');
}

export function isCompleted(result: PlayerOnboardResult): boolean {
  return result.status === 'Completed' && !result.response.startsWith('FAILED:') && !result.failures?.length;
}

export interface PlayerLegend {
  id: number; legendName: string; playerId: number; playerLinkId: number; playerName: string | null; placements: number[] | null;
}
