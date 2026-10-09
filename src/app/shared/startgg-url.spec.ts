import { normalizeBracketUrl, normalizeUserSlug, normalizeTournamentSlug } from './startgg-url';

describe('Start.gg links', () => {
  it('normalizes full profile URLs, profile paths, and tokens', () => {
    for (const input of ['start.gg/user/b1a179d8', 'https://www.start.gg/user/b1a179d8/?x=1', '/user/b1a179d8/', ' b1a179d8 ']) {
      expect(normalizeUserSlug(input)).toBe('user/b1a179d8');
    }
  });
  it('rejects foreign hosts, credentials, unsafe schemes, and incomplete profiles', () => {
    for (const input of ['https://start.gg.evil.test/user/x', 'https://evil@start.gg/user/x', 'javascript:alert(1)', '//evil.test/user/x', '', 'user/a/b']) {
      expect(() => normalizeUserSlug(input)).toThrow();
    }
  });
  it('requires the event and both bracket IDs and sends an absolute URL', () => {
    expect(normalizeBracketUrl('start.gg/tournament/test/event/singles/brackets/123/456?x=1'))
      .toBe('https://start.gg/tournament/test/event/singles/brackets/123/456');
    for (const input of ['https://start.gg/tournament/test/event/singles', 'tournament/test/event/singles/brackets/0/456', 'https://example.com/tournament/test/event/singles/brackets/1/2']) {
      expect(() => normalizeBracketUrl(input)).toThrow();
    }
  });
});

describe('Tournament search slugs', () => {
  it('supports event-prefixed suffixes and full URLs while rejecting parent-only tournaments', () => {
    expect(normalizeTournamentSlug('event/street-fighter-6-ps5')).toBe('street-fighter-6-ps5');
    expect(normalizeTournamentSlug('https://start.gg/tournament/evo/event/sf6')).toBe('tournament/evo/event/sf6');
    expect(() => normalizeTournamentSlug('tournament/evo')).toThrow();
  });
});
