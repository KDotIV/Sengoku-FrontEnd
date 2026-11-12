import type { AddressEventResult } from '../../services/event-location.service';

export interface TournamentCardHeader {
  image: string;
  className: string;
  name: string;
}

export interface TournamentGame extends TournamentCardHeader {
  /** start.gg videogame ID, sent to QueryEventsByLocation as GameIds. */
  id: number;
  aliases: readonly string[];
}

// Keep search options and card artwork together so new games cannot drift apart.
export const TOURNAMENT_GAMES: readonly TournamentGame[] = [
  {
    id: 33945, name: 'Guilty Gear Strive',
    image: '/TournamentCards/Striveheader.jpg', className: 'game-strive',
    aliases: ['Guilty Gear Strive', 'GGST', 'Strive']
  },
  {
    id: 1386, name: 'Smash Ultimate',
    image: '/TournamentCards/SmashUltimateheader.jpg', className: 'game-smash',
    aliases: ['Super Smash Bros Ultimate', 'SSBU']
  },
  {
    id: 43868, name: 'Street Fighter 6',
    image: '/TournamentCards/SF6header.jpg', className: 'game-sf6',
    aliases: ['SF6', 'Street Fighter VI']
  },
  {
    id: 49783, name: 'Tekken 8',
    image: '/TournamentCards/T8header.png', className: 'game-t8',
    aliases: ['T8', 'Tekken VIII']
  },
  {
    id: 107706, name: 'MARVEL Tōkon: Fighting Souls',
    image: '/TournamentCards/TOKONheader.jpg', className: 'game-tokon',
    aliases: ['Marvel Tokon', 'Tokon', 'Fighting Souls']
  },
  {
    id: 114292, name: 'Avatar Legends: The Fighting Game',
    image: '/TournamentCards/AvatarLegendsheader.jpg', className: 'game-avatar',
    aliases: ['Avatar Legends', 'Avatar The Last Airbender', 'Avatar Last Airbender', 'ATLA', 'AVL']
  },
  {
    id: 48548, name: 'Granblue Fantasy Versus: Rising',
    image: '/TournamentCards/GBVSRheader.jpg', className: 'game-gbvsr',
    aliases: ['Granblue Versus Rising', 'GBVSR']
  },
  {
    id: 610, name: 'Third Strike',
    image: '/TournamentCards/ThirdStrikeheader.png', className: 'game-third-strike',
    aliases: ['3rd Strike', 'SF3TS', 'SFIII3S', '3S']
  },
  {
    id: 36963, name: 'The King of Fighters XV',
    image: '/TournamentCards/KOFXVheader.jpg', className: 'game-kof',
    aliases: ['KOF XV', 'KOFXV', 'KOF 15', 'KOF15', 'King of Fighters XV', 'King of Fighters 15']
  },
  {
    id: 5582, name: 'Soul Calibur II',
    image: '/TournamentCards/SC2header.png', className: 'game-sc2',
    aliases: ['Soul Calibur 2', 'SoulCalibur II', 'SoulCalibur 2', 'SC2']
  },
  {
    id: 48599, name: 'Mortal Kombat 1',
    image: '/TournamentCards/MK1header.jpg', className: 'game-mk1',
    aliases: ['MK1', 'MK 1']
  },
  {
    id: 287, name: 'Dragon Ball FighterZ',
    image: '/TournamentCards/DBFZheader.jpg', className: 'game-dbfz',
    aliases: ['Dragonball FighterZ', 'DBFZ']
  },
  {
    id: 1, name: 'Smash Melee',
    image: '/TournamentCards/SmashMeleeheader.png', className: 'game-melee',
    aliases: ['Super Smash Bros Melee', 'SSBM', 'Melee']
  }
];

const DEFAULT_HEADER: TournamentCardHeader = {
  image: '', className: 'game-default', name: 'Tournament'
};

function normalizeGameText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const GAME_MATCHERS = TOURNAMENT_GAMES.map(game => ({
  game,
  aliases: [game.name, ...game.aliases].map(alias => ` ${normalizeGameText(alias)} `)
}));

function matchGames(values: (string | undefined)[]): TournamentGame[] {
  const text = ` ${normalizeGameText(values.filter(Boolean).join(' '))} `;
  return GAME_MATCHERS.filter(({ aliases }) => aliases.some(alias => text.includes(alias)))
    .map(({ game }) => game);
}

export function getTournamentCardHeader(
  event: AddressEventResult, selectedGames: readonly number[] = []
): TournamentCardHeader {
  const gameId = Number(event.gameId);
  const gameById = TOURNAMENT_GAMES.find(game => game.id === gameId);
  if (gameById) {
    return gameById;
  }

  // Explicit game metadata wins over titles/descriptions advertising other brackets.
  const gameNames = [event.gameName, event.videoGameName, event.videogameName];
  const namedGames = matchGames(gameNames);
  if (namedGames.length === 1) {
    return namedGames[0];
  }
  if (gameId > 0 || gameNames.some(name => name?.trim())) {
    return DEFAULT_HEADER;
  }

  const mentionedGames = matchGames([event.eventName, event.eventDescription, event.urlSlug]);
  if (mentionedGames.length > 0) {
    return mentionedGames.length === 1 ? mentionedGames[0] : DEFAULT_HEADER;
  }

  // Older API responses omit the game. A single search filter is unambiguous.
  return selectedGames.length === 1
    ? TOURNAMENT_GAMES.find(game => game.id === selectedGames[0]) ?? DEFAULT_HEADER
    : DEFAULT_HEADER;
}
