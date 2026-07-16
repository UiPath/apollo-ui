import type { TextSelection } from './StickyNoteNode.types';

export type StickyNoteMediaType = 'image' | 'video';

export type StickyNoteMedia =
  | { kind: 'image'; url: string; alt: string; fullWidth: boolean }
  | { kind: 'youtube'; videoId: string; fullWidth: boolean }
  | { kind: 'publicVideo'; url: string; fullWidth: boolean };

export type StickyNoteMediaError =
  | 'invalid-url'
  | 'https-required'
  | 'invalid-youtube-url'
  | 'unsupported-video-url';

export type StickyNoteMediaParseResult =
  | { ok: true; value: StickyNoteMedia }
  | { ok: false; error: StickyNoteMediaError };

export interface StickyNoteMediaToken {
  media: StickyNoteMedia;
  start: number;
  end: number;
}

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const PAGE_BASED_VIDEO_HOSTS = new Set([
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'loom.com',
  'www.loom.com',
]);
const MEDIA_TITLE_PREFIX = 'sticky-note-media';
const MEDIA_TITLE_PATTERN =
  /^sticky-note-media;kind=(image|youtube|publicVideo);layout=(natural-width|full-width)$/;
const FLOW_MEDIA_TITLE_PATTERN = /^flow-media:(image|youtube|video):(natural-width|full-width)$/;
const LEGACY_FULL_WIDTH_IMAGE_TITLE = 'flow-full-width';

function parseHttpsUrl(
  rawUrl: string
): { ok: true; url: URL } | { ok: false; error: StickyNoteMediaError } {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: 'invalid-url' };
  }

  if (url.protocol !== 'https:') return { ok: false, error: 'https-required' };
  if (url.username || url.password) return { ok: false, error: 'invalid-url' };
  return { ok: true, url };
}

function youtubeVideoId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase();
  let candidate: string | null = null;

  if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
    candidate = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (url.pathname === '/watch') {
    candidate = url.searchParams.get('v');
  } else {
    const [kind, id] = url.pathname.split('/').filter(Boolean);
    if (kind === 'embed' || kind === 'live' || kind === 'shorts') candidate = id ?? null;
  }

  return candidate && YOUTUBE_VIDEO_ID.test(candidate) ? candidate : null;
}

export function parseStickyNoteMediaUrl(
  rawUrl: string,
  mediaType: StickyNoteMediaType,
  options: { alt?: string; fullWidth?: boolean } = {}
): StickyNoteMediaParseResult {
  const parsed = parseHttpsUrl(rawUrl);
  if (!parsed.ok) return parsed;

  const { url } = parsed;
  const hostname = url.hostname.toLowerCase();
  const fullWidth = options.fullWidth ?? false;

  if (mediaType === 'image') {
    if (YOUTUBE_HOSTS.has(hostname)) return { ok: false, error: 'invalid-url' };
    return {
      ok: true,
      value: { kind: 'image', url: url.toString(), alt: options.alt ?? '', fullWidth },
    };
  }

  if (YOUTUBE_HOSTS.has(hostname)) {
    const videoId = youtubeVideoId(url);
    return videoId
      ? { ok: true, value: { kind: 'youtube', videoId, fullWidth } }
      : { ok: false, error: 'invalid-youtube-url' };
  }

  if (hostname.includes('youtube.') || hostname.includes('youtu.be')) {
    return { ok: false, error: 'invalid-url' };
  }
  if (PAGE_BASED_VIDEO_HOSTS.has(hostname)) {
    return { ok: false, error: 'unsupported-video-url' };
  }
  return { ok: true, value: { kind: 'publicVideo', url: url.toString(), fullWidth } };
}

function escapeMarkdownLabel(value: string): string {
  return value
    .replace(/\r\n?|\n/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

export function serializeStickyNoteMedia(media: StickyNoteMedia): string {
  const layout = media.fullWidth ? 'full-width' : 'natural-width';
  const title = `${MEDIA_TITLE_PREFIX};kind=${media.kind};layout=${layout}`;

  if (media.kind === 'youtube') {
    return `![YouTube video](<https://www.youtube.com/watch?v=${media.videoId}> "${title}")`;
  }

  const label = media.kind === 'image' ? escapeMarkdownLabel(media.alt) : 'Video';
  return `![${label}](<${new URL(media.url).toString()}> "${title}")`;
}

function mediaTypeForKind(kind: StickyNoteMedia['kind']): StickyNoteMediaType {
  return kind === 'image' ? 'image' : 'video';
}

export function parseStickyNoteMediaSource(
  source: string,
  alt = '',
  title?: string
): StickyNoteMedia | null {
  if (title === LEGACY_FULL_WIDTH_IMAGE_TITLE) {
    const result = parseStickyNoteMediaUrl(source, 'image', { alt, fullWidth: true });
    return result.ok ? result.value : null;
  }

  const marker = title?.match(MEDIA_TITLE_PATTERN);
  const flowMarker = title?.match(FLOW_MEDIA_TITLE_PATTERN);
  const kind = marker?.[1] ?? flowMarker?.[1];
  const layout = marker?.[2] ?? flowMarker?.[2];
  if (!kind || !layout) return null;

  if (!(kind === 'image' || kind === 'youtube' || kind === 'publicVideo' || kind === 'video')) {
    return null;
  }
  const normalizedKind: StickyNoteMedia['kind'] = kind === 'video' ? 'publicVideo' : kind;
  const result = parseStickyNoteMediaUrl(source, mediaTypeForKind(normalizedKind), {
    alt,
    fullWidth: layout === 'full-width',
  });
  return result.ok && result.value.kind === normalizedKind ? result.value : null;
}

function normalizedRange(
  length: number,
  selectionStart: number,
  selectionEnd: number
): [number, number] {
  const start = Math.max(0, Math.min(length, Math.min(selectionStart, selectionEnd)));
  const end = Math.max(0, Math.min(length, Math.max(selectionStart, selectionEnd)));
  return [start, end];
}

function separatorAfter(prefix: string): string {
  if (!prefix || prefix.endsWith('\n\n')) return '';
  return prefix.endsWith('\n') ? '\n' : '\n\n';
}

function separatorBefore(suffix: string): string {
  if (!suffix || suffix.startsWith('\n\n')) return '';
  return suffix.startsWith('\n') ? '\n' : '\n\n';
}

export function insertStickyNoteMedia(
  currentValue: string,
  block: string,
  selection: TextSelection | null
): TextSelection {
  const selectionIsCurrent = selection?.value === currentValue;
  const [start, end] = selectionIsCurrent
    ? normalizedRange(currentValue.length, selection.selectionStart, selection.selectionEnd)
    : [currentValue.length, currentValue.length];
  const before = currentValue.slice(0, start);
  const after = currentValue.slice(end);
  const leadingSeparator = separatorAfter(before);
  const trailingSeparator = separatorBefore(after);
  const value = `${before}${leadingSeparator}${block}${trailingSeparator}${after}`;
  const caret = before.length + leadingSeparator.length + block.length + trailingSeparator.length;
  return { value, selectionStart: caret, selectionEnd: caret };
}

function replaceTextRange(
  currentValue: string,
  selectionStart: number,
  selectionEnd: number,
  replacement: string
): TextSelection {
  const [start, end] = normalizedRange(currentValue.length, selectionStart, selectionEnd);
  const value = currentValue.slice(0, start) + replacement + currentValue.slice(end);
  const caret = start + replacement.length;
  return { value, selectionStart: caret, selectionEnd: caret };
}

function unescapeMarkdownLabel(value: string): string {
  return value.replace(/\\(.)/g, (match, escaped: string) =>
    escaped === '\\' || escaped === '[' || escaped === ']' ? escaped : match
  );
}

interface SourceRange {
  start: number;
  end: number;
}

function fencedCodeRanges(content: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  let openFence: { marker: '`' | '~'; length: number; start: number } | null = null;
  let lineStart = 0;

  while (lineStart < content.length) {
    let lineEnd = lineStart;
    while (lineEnd < content.length && content[lineEnd] !== '\n' && content[lineEnd] !== '\r') {
      lineEnd += 1;
    }
    let nextLineStart = lineEnd;
    if (content[nextLineStart] === '\r') nextLineStart += 1;
    if (content[nextLineStart] === '\n') nextLineStart += 1;
    const line = content.slice(lineStart, lineEnd);

    if (openFence) {
      const closingFence = new RegExp(`^ {0,3}${openFence.marker}{${openFence.length},}[ \\t]*$`);
      if (closingFence.test(line)) {
        ranges.push({ start: openFence.start, end: nextLineStart });
        openFence = null;
      }
    } else {
      const openingFence = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      const fence = openingFence?.[1];
      const marker = fence?.[0];
      const info = openingFence
        ? line.slice((openingFence.index ?? 0) + openingFence[0].length)
        : '';
      if (
        openingFence &&
        fence &&
        (marker === '`' || marker === '~') &&
        !(marker === '`' && info.includes('`'))
      ) {
        openFence = { marker, length: fence.length, start: lineStart };
      }
    }

    lineStart = nextLineStart;
  }

  if (openFence) ranges.push({ start: openFence.start, end: content.length });
  return ranges;
}

function isBackslashEscaped(content: string, index: number, segmentStart: number): boolean {
  let count = 0;
  for (let cursor = index - 1; cursor >= segmentStart && content[cursor] === '\\'; cursor -= 1) {
    count += 1;
  }
  return count % 2 === 1;
}

function inlineCodeRanges(content: string, start: number, end: number): SourceRange[] {
  const ranges: SourceRange[] = [];
  let index = start;

  while (index < end) {
    if (content[index] !== '`' || isBackslashEscaped(content, index, start)) {
      index += 1;
      continue;
    }

    let openingEnd = index + 1;
    while (openingEnd < end && content[openingEnd] === '`') openingEnd += 1;
    const markerLength = openingEnd - index;
    let closingStart = openingEnd;
    let found = false;

    while (closingStart < end) {
      closingStart = content.indexOf('`', closingStart);
      if (closingStart < 0 || closingStart >= end) break;
      let closingEnd = closingStart + 1;
      while (closingEnd < end && content[closingEnd] === '`') closingEnd += 1;
      if (closingEnd - closingStart === markerLength) {
        ranges.push({ start: index, end: closingEnd });
        index = closingEnd;
        found = true;
        break;
      }
      closingStart = closingEnd;
    }

    if (!found) index = openingEnd;
  }

  return ranges;
}

function markdownCodeRanges(content: string): SourceRange[] {
  const fencedRanges = fencedCodeRanges(content);
  const ranges = [...fencedRanges];
  let segmentStart = 0;

  for (const fencedRange of fencedRanges) {
    ranges.push(...inlineCodeRanges(content, segmentStart, fencedRange.start));
    segmentStart = fencedRange.end;
  }
  ranges.push(...inlineCodeRanges(content, segmentStart, content.length));
  return ranges.sort((left, right) => left.start - right.start);
}

export function parseStickyNoteMediaTokens(content: string): StickyNoteMediaToken[] {
  const tokens: StickyNoteMediaToken[] = [];
  const codeRanges = markdownCodeRanges(content);
  const mediaPattern =
    /!\[((?:\\.|[^\]\\])*)\]\((?:<([^>\r\n]+)>|([^\s)\r\n]+))(?:\s+"([^"]*)")?\)/g;
  let codeRangeIndex = 0;

  for (const match of content.matchAll(mediaPattern)) {
    const start = match.index;
    if (start === undefined) continue;
    const end = start + match[0].length;
    while (
      codeRanges[codeRangeIndex] &&
      (codeRanges[codeRangeIndex]?.end ?? Number.POSITIVE_INFINITY) <= start
    ) {
      codeRangeIndex += 1;
    }
    const codeRange = codeRanges[codeRangeIndex];
    if (codeRange && start >= codeRange.start && start < codeRange.end) continue;

    const media = parseStickyNoteMediaSource(
      match[2] ?? match[3] ?? '',
      unescapeMarkdownLabel(match[1] ?? ''),
      match[4]
    );
    if (media) tokens.push({ media, start, end });
  }

  return tokens;
}

export function findStickyNoteMediaAtSelection(
  content: string,
  selectionStart: number,
  selectionEnd: number
): StickyNoteMediaToken | null {
  const [start, end] = normalizedRange(content.length, selectionStart, selectionEnd);
  return (
    parseStickyNoteMediaTokens(content).find((token) =>
      start === end
        ? start >= token.start && start < token.end
        : start < token.end && end > token.start
    ) ?? null
  );
}

function sameSource(left: StickyNoteMedia, right: StickyNoteMedia): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'image' && right.kind === 'image') return left.url === right.url;
  if (left.kind === 'youtube' && right.kind === 'youtube') return left.videoId === right.videoId;
  return left.kind === 'publicVideo' && right.kind === 'publicVideo' && left.url === right.url;
}

export function replaceStickyNoteMedia(
  content: string,
  original: StickyNoteMediaToken,
  replacement: string
): TextSelection | null {
  let closest: StickyNoteMediaToken | null = null;
  for (const token of parseStickyNoteMediaTokens(content)) {
    if (!sameSource(token.media, original.media)) continue;
    if (
      !closest ||
      Math.abs(token.start - original.start) < Math.abs(closest.start - original.start)
    ) {
      closest = token;
    }
  }
  return closest ? replaceTextRange(content, closest.start, closest.end, replacement) : null;
}
