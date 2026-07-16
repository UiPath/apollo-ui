import { describe, expect, it } from 'vitest';
import {
  findStickyNoteMediaAtSelection,
  insertStickyNoteMedia,
  parseStickyNoteMediaSource,
  parseStickyNoteMediaTokens,
  parseStickyNoteMediaUrl,
  replaceStickyNoteMedia,
  serializeStickyNoteMedia,
} from './StickyNoteMedia';

describe('StickyNoteMedia', () => {
  it('classifies image, YouTube, and direct public video links from the selected media type', () => {
    expect(parseStickyNoteMediaUrl('https://example.com/photo', 'image')).toEqual({
      ok: true,
      value: {
        kind: 'image',
        url: 'https://example.com/photo',
        alt: '',
        fullWidth: false,
      },
    });
    expect(parseStickyNoteMediaUrl('https://youtu.be/M7lc1UVf-VE', 'video')).toEqual({
      ok: true,
      value: { kind: 'youtube', videoId: 'M7lc1UVf-VE', fullWidth: false },
    });
    expect(parseStickyNoteMediaUrl('https://example.com/signed-video?token=123', 'video')).toEqual({
      ok: true,
      value: {
        kind: 'publicVideo',
        url: 'https://example.com/signed-video?token=123',
        fullWidth: false,
      },
    });
  });

  it('rejects unsafe and unsupported video links', () => {
    expect(parseStickyNoteMediaUrl('http://example.com/image.png', 'image')).toEqual({
      ok: false,
      error: 'https-required',
    });
    expect(parseStickyNoteMediaUrl('https://youtube.com/watch?v=bad', 'video')).toEqual({
      ok: false,
      error: 'invalid-youtube-url',
    });
    expect(parseStickyNoteMediaUrl('https://vimeo.com/123', 'video')).toEqual({
      ok: false,
      error: 'unsupported-video-url',
    });
  });

  it('round-trips full-width metadata and reads the prior Flow marker for compatibility', () => {
    const media = {
      kind: 'image' as const,
      url: 'https://example.com/image.png',
      alt: 'A [diagram]',
      fullWidth: true,
    };
    const markdown = serializeStickyNoteMedia(media);

    expect(markdown).toBe(
      '![A \\[diagram\\]](<https://example.com/image.png> "sticky-note-media;kind=image;layout=full-width")'
    );
    expect(
      parseStickyNoteMediaSource(
        'https://example.com/video.mp4',
        'Video',
        'flow-media:video:natural-width'
      )
    ).toEqual({
      kind: 'publicVideo',
      url: 'https://example.com/video.mp4',
      fullWidth: false,
    });
  });

  it('inserts at the cursor but appends when the captured editor value is stale', () => {
    const selection = { value: 'BeforeAfter', selectionStart: 6, selectionEnd: 6 };

    expect(insertStickyNoteMedia('BeforeAfter', 'MEDIA', selection)).toEqual({
      value: 'Before\n\nMEDIA\n\nAfter',
      selectionStart: 15,
      selectionEnd: 15,
    });
    expect(insertStickyNoteMedia('BeforeAfter updated', 'MEDIA', selection)).toEqual({
      value: 'BeforeAfter updated\n\nMEDIA',
      selectionStart: 26,
      selectionEnd: 26,
    });
  });

  it('does not treat media-looking text inside inline or fenced code as editable media', () => {
    const token =
      '![Image](<https://example.com/image.png> "sticky-note-media;kind=image;layout=natural-width")';
    const content = [`\`${token}\``, '```md', token, '```', token].join('\n\n');

    expect(parseStickyNoteMediaTokens(content)).toHaveLength(1);
    expect(findStickyNoteMediaAtSelection(content, 2, 2)).toBeNull();
  });

  it('relocates an edited token after surrounding content changes', () => {
    const original = serializeStickyNoteMedia({
      kind: 'youtube',
      videoId: 'M7lc1UVf-VE',
      fullWidth: false,
    });
    const token = parseStickyNoteMediaTokens(`Before\n\n${original}`)[0];
    const replacement = serializeStickyNoteMedia({
      kind: 'youtube',
      videoId: 'M7lc1UVf-VE',
      fullWidth: true,
    });

    expect(token).toBeDefined();
    expect(replaceStickyNoteMedia(`New prefix\n\n${original}`, token!, replacement)?.value).toBe(
      `New prefix\n\n${replacement}`
    );
  });
});
