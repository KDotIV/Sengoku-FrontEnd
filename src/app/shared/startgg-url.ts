function startggPath(input: string): string {
  let value = input.trim();
  if (/^(?:www\.)?start\.gg\//i.test(value)) value = `https://${value}`;
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) {
    let url: URL;
    try { url = new URL(value); } catch { throw new Error('Enter a valid Start.gg link.'); }
    if (!['https:', 'http:'].includes(url.protocol) ||
        !['start.gg', 'www.start.gg'].includes(url.hostname) || url.username || url.password || url.port) {
      throw new Error('Use a link from start.gg.');
    }
    value = url.pathname;
  }
  return value.replace(/^\/+|\/+$/g, '');
}

export function normalizeUserSlug(input: string): string {
  let path = startggPath(input);
  if (!path.startsWith('user/')) path = `user/${path}`;
  if (!/^user\/[a-zA-Z0-9_-]+$/.test(path)) {
    throw new Error('Enter a Start.gg profile link such as start.gg/user/b1a179d8.');
  }
  return path;
}

export function normalizeBracketUrl(input: string): string {
  const path = startggPath(input);
  if (!/^tournament\/[a-zA-Z0-9_-]+\/event\/[a-zA-Z0-9_-]+\/brackets\/[1-9]\d*\/[1-9]\d*$/.test(path)) {
    throw new Error('Use the full bracket link ending in /brackets/phase-id/bracket-id.');
  }
  return `https://start.gg/${path}`;
}

export function normalizeTournamentSlug(input: string): string {
  let path = startggPath(input);
  // The UX accepts event/foo; the backend accepts foo or a full canonical event path.
  if (/^event\/[a-zA-Z0-9_-]+$/.test(path)) path = path.slice(6);
  if (!/^(?:[a-zA-Z0-9_-]+|tournament\/[a-zA-Z0-9_-]+\/event\/[a-zA-Z0-9_-]+)$/.test(path)) {
    throw new Error('Use an event slug or a Start.gg URL ending in /event/event-slug.');
  }
  return path;
}
