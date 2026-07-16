import { CanvasIcon } from '@uipath/apollo-react/canvas';
import {
  type ComponentProps,
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useState,
} from 'react';
import type { Components, ExtraProps } from 'react-markdown';
import { useSafeLingui } from '../../../i18n';
import { parseStickyNoteMediaSource, type StickyNoteMedia } from './StickyNoteMedia';

export interface StickyNoteMediaSourceRange {
  start: number;
  end: number;
}

interface StickyNoteMediaMarkdownOptions {
  editable: boolean;
  onEditMedia?: (media: StickyNoteMedia, range: StickyNoteMediaSourceRange) => void;
}

const StickyNoteMediaMarkdownContext = createContext<StickyNoteMediaMarkdownOptions>({
  editable: false,
});

export function StickyNoteMediaMarkdownProvider({
  value,
  children,
}: {
  value: StickyNoteMediaMarkdownOptions;
  children: ReactNode;
}) {
  return (
    <StickyNoteMediaMarkdownContext.Provider value={value}>
      {children}
    </StickyNoteMediaMarkdownContext.Provider>
  );
}

type MarkdownImageProps = ComponentProps<'img'> & ExtraProps;

type StickyNoteMediaImageProps = MarkdownImageProps & {
  fallbackImage?: Components['img'];
};

function sourceRange(node: MarkdownImageProps['node']): StickyNoteMediaSourceRange | null {
  const start = node?.position?.start?.offset;
  const end = node?.position?.end?.offset;
  return typeof start === 'number' && typeof end === 'number' ? { start, end } : null;
}

function MediaContainer({ fullWidth, children }: { fullWidth: boolean; children: ReactNode }) {
  return (
    <span
      className="relative my-2 block max-w-full overflow-hidden rounded-md"
      style={{ width: fullWidth ? '100%' : 'min(320px, 100%)' }}
      data-sticky-media
      data-sticky-full-width={fullWidth}
    >
      {children}
    </span>
  );
}

function MediaEditButton({ onClick }: { onClick: () => void }) {
  const { _ } = useSafeLingui();
  const label = _({ id: 'sticky-note.media.edit', message: 'Edit media' });
  return (
    <button
      type="button"
      data-sticky-media-control
      aria-label={label}
      title={label}
      className="absolute right-1 top-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded bg-surface-raised/95 text-foreground opacity-80 shadow-sm transition-opacity hover:bg-surface-hover hover:opacity-100 focus-visible:opacity-100"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <CanvasIcon icon="pencil" size={14} />
    </button>
  );
}

function StickyNoteMediaImage({
  src,
  alt = '',
  title,
  node,
  fallbackImage,
  ...imageProps
}: StickyNoteMediaImageProps) {
  const { _ } = useSafeLingui();
  const { editable, onEditMedia } = useContext(StickyNoteMediaMarkdownContext);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [loadedYouTubeId, setLoadedYouTubeId] = useState<string | null>(null);
  const media = typeof src === 'string' ? parseStickyNoteMediaSource(src, alt, title) : null;
  const range = sourceRange(node);

  if (!media) {
    if (fallbackImage) {
      const fallbackProps = { ...imageProps, src, alt, title };
      return typeof fallbackImage === 'string'
        ? createElement(fallbackImage, fallbackProps)
        : createElement(fallbackImage, { ...fallbackProps, node });
    }
    return <img {...imageProps} src={src} alt={alt} title={title} />;
  }

  const editButton = editable && range && onEditMedia && (
    <MediaEditButton onClick={() => onEditMedia(media, range)} />
  );

  if (media.kind === 'youtube') {
    const playLabel = _({ id: 'sticky-note.media.play-video', message: 'Play video' });
    const youtubeLoaded = loadedYouTubeId === media.videoId;
    return (
      <MediaContainer fullWidth={media.fullWidth}>
        {youtubeLoaded ? (
          // YouTube is cross-origin, so this preserves its origin-bound browser APIs without
          // granting the player same-origin access to the Apollo host.
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=1`}
            title={_({ id: 'sticky-note.media.youtube-title', message: 'YouTube video' })}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="block aspect-video w-full border-0"
            onPointerDown={(event) => event.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            data-sticky-media-control
            aria-label={playLabel}
            className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setLoadedYouTubeId(media.videoId);
            }}
            onDoubleClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <img
              src={`https://i.ytimg.com/vi/${media.videoId}/hqdefault.jpg`}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-70"
            />
            <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 shadow-sm">
              <CanvasIcon icon="play" size={18} />
              {playLabel}
            </span>
          </button>
        )}
        {editButton}
      </MediaContainer>
    );
  }

  if (media.kind === 'publicVideo') {
    const videoLabel = alt || _({ id: 'sticky-note.media.video-label', message: 'Embedded video' });
    return (
      <MediaContainer fullWidth={media.fullWidth}>
        {/* biome-ignore lint/a11y/useMediaCaption: Consumers provide one public video URL, not a separate caption track. */}
        <video
          src={media.url}
          aria-label={videoLabel}
          controls
          preload="metadata"
          playsInline
          className="block h-auto w-full bg-black"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {_({
            id: 'sticky-note.media.video-unavailable',
            message: 'Video playback is unavailable.',
          })}
        </video>
        {editButton}
      </MediaContainer>
    );
  }

  const imageFailed = failedImageUrl === media.url;
  return (
    <MediaContainer fullWidth={media.fullWidth}>
      {imageFailed ? (
        <span
          role="img"
          aria-label={
            alt ||
            _({ id: 'sticky-note.media.image-unavailable-label', message: 'Image unavailable' })
          }
          className="flex min-h-20 items-center justify-center bg-black/10 px-3 text-center text-xs text-foreground-muted"
        >
          {_({ id: 'sticky-note.media.image-unavailable', message: 'Image unavailable' })}
        </span>
      ) : (
        <img
          {...imageProps}
          src={media.url}
          alt={alt}
          draggable={false}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          style={{
            display: 'block',
            maxWidth: '100%',
            width: media.fullWidth ? '100%' : 'auto',
            height: 'auto',
          }}
          onError={() => setFailedImageUrl(media.url)}
        />
      )}
      {editButton}
    </MediaContainer>
  );
}

export function createStickyNoteMediaMarkdownComponents(
  fallbackImage?: Components['img']
): Components {
  return {
    img: (props) => <StickyNoteMediaImage {...props} fallbackImage={fallbackImage} />,
  };
}
