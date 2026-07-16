import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@uipath/apollo-wind';
import { useId, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import {
  parseStickyNoteMediaUrl,
  type StickyNoteMedia,
  type StickyNoteMediaError,
  type StickyNoteMediaType,
} from './StickyNoteMedia';

export interface StickyNoteMediaDialogProps {
  initialMedia?: StickyNoteMedia;
  onCancel: () => void;
  onSubmit: (media: StickyNoteMedia) => void;
}

function initialUrl(media: StickyNoteMedia | undefined): string {
  if (!media) return '';
  return media.kind === 'youtube' ? `https://www.youtube.com/watch?v=${media.videoId}` : media.url;
}

function initialType(media: StickyNoteMedia | undefined): StickyNoteMediaType {
  return media?.kind === 'image' || !media ? 'image' : 'video';
}

export function StickyNoteMediaDialog({
  initialMedia,
  onCancel,
  onSubmit,
}: StickyNoteMediaDialogProps) {
  const { _ } = useSafeLingui();
  const urlId = useId();
  const altId = useId();
  const fullWidthId = useId();
  const imageTypeId = useId();
  const videoTypeId = useId();
  const [mediaType, setMediaType] = useState<StickyNoteMediaType>(() => initialType(initialMedia));
  const [url, setUrl] = useState(() => initialUrl(initialMedia));
  const [alt, setAlt] = useState(() => (initialMedia?.kind === 'image' ? initialMedia.alt : ''));
  const [fullWidth, setFullWidth] = useState(initialMedia?.fullWidth ?? false);
  const [touched, setTouched] = useState(false);
  const [previewState, setPreviewState] = useState<'loading' | 'loaded' | 'failed'>(() =>
    initialMedia?.kind === 'youtube' || !initialMedia ? 'loaded' : 'loading'
  );
  const parsed = useMemo(
    () => parseStickyNoteMediaUrl(url, mediaType, { alt: alt.trim(), fullWidth }),
    [alt, fullWidth, mediaType, url]
  );
  const previewRequired = parsed.ok && parsed.value.kind !== 'youtube';
  const isEditing = initialMedia !== undefined;

  const validationMessage = (error: StickyNoteMediaError): string => {
    if (error === 'invalid-youtube-url') {
      return _({
        id: 'sticky-note.media.dialog.invalid-youtube',
        message: 'Add a valid YouTube video URL',
      });
    }
    if (error === 'unsupported-video-url') {
      return _({
        id: 'sticky-note.media.dialog.unsupported-video',
        message: 'Add a YouTube URL or a direct public video file URL such as MP4',
      });
    }
    return _({
      id: 'sticky-note.media.dialog.invalid-url',
      message: 'Enter a valid public HTTPS URL',
    });
  };

  const error = url.trim() && !parsed.ok ? validationMessage(parsed.error) : null;
  const canSubmit = parsed.ok && (!previewRequired || previewState === 'loaded');

  const resetPreview = (nextType: StickyNoteMediaType, nextUrl: string) => {
    const next = parseStickyNoteMediaUrl(nextUrl, nextType);
    setPreviewState(next.ok && next.value.kind === 'youtube' ? 'loaded' : 'loading');
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? _({ id: 'sticky-note.media.dialog.edit-title', message: 'Edit media' })
              : _({ id: 'sticky-note.media.dialog.add-title', message: 'Embed image or video' })}
          </DialogTitle>
          <DialogDescription>
            {_({
              id: 'sticky-note.media.dialog.description',
              message: 'Add a public link. Video supports YouTube and direct video files.',
            })}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit && parsed.ok) onSubmit(parsed.value);
          }}
        >
          <div className="flex flex-col gap-4 py-2">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 text-sm font-medium">
                {_({ id: 'sticky-note.media.dialog.type-label', message: 'Media type' })}
              </legend>
              <RadioGroup
                value={mediaType}
                onValueChange={(value) => {
                  const nextType = value as StickyNoteMediaType;
                  setMediaType(nextType);
                  setTouched(false);
                  resetPreview(nextType, url);
                }}
                className="flex gap-5"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="image" id={imageTypeId} />
                  <Label htmlFor={imageTypeId}>
                    {_({ id: 'sticky-note.media.dialog.image-option', message: 'Image' })}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="video" id={videoTypeId} />
                  <Label htmlFor={videoTypeId}>
                    {_({ id: 'sticky-note.media.dialog.video-option', message: 'Video' })}
                  </Label>
                </div>
              </RadioGroup>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={urlId}>
                {mediaType === 'image'
                  ? _({ id: 'sticky-note.media.dialog.image-url-label', message: 'Image URL' })
                  : _({ id: 'sticky-note.media.dialog.video-url-label', message: 'Video URL' })}
              </Label>
              <Input
                id={urlId}
                type="url"
                autoFocus
                value={url}
                placeholder={
                  mediaType === 'image'
                    ? _({
                        id: 'sticky-note.media.dialog.image-url-placeholder',
                        message: 'https://example.com/image.png',
                      })
                    : _({
                        id: 'sticky-note.media.dialog.video-url-placeholder',
                        message: 'https://youtube.com/watch?v=… or https://example.com/video.mp4',
                      })
                }
                aria-invalid={touched && Boolean(error)}
                aria-describedby={`${urlId}-helper${touched && error ? ` ${urlId}-error` : ''}`}
                onChange={(event) => {
                  const nextUrl = event.target.value;
                  setUrl(nextUrl);
                  setTouched(true);
                  resetPreview(mediaType, nextUrl);
                }}
                onBlur={() => setTouched(true)}
              />
              <p id={`${urlId}-helper`} className="m-0 text-xs text-foreground-muted">
                {mediaType === 'image'
                  ? _({
                      id: 'sticky-note.media.dialog.image-url-help',
                      message: 'Use a public HTTPS image link.',
                    })
                  : _({
                      id: 'sticky-note.media.dialog.video-url-help',
                      message: 'Use a YouTube link or a direct public HTTPS video file link.',
                    })}
              </p>
              {touched && error && (
                <p id={`${urlId}-error`} role="alert" className="m-0 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>

            {mediaType === 'image' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={altId}>
                  {_({ id: 'sticky-note.media.dialog.alt-label', message: 'Alternative text' })}
                </Label>
                <Input id={altId} value={alt} onChange={(event) => setAlt(event.target.value)} />
                <p className="m-0 text-xs text-foreground-muted">
                  {_({
                    id: 'sticky-note.media.dialog.alt-help',
                    message: 'Describe the image for people who use screen readers.',
                  })}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Checkbox
                id={fullWidthId}
                checked={fullWidth}
                onCheckedChange={(checked) => setFullWidth(checked === true)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor={fullWidthId} className="text-sm font-medium leading-none">
                  {_({
                    id: 'sticky-note.media.dialog.full-width-label',
                    message: 'Make full width',
                  })}
                </Label>
                <p className="m-0 text-xs text-foreground-muted">
                  {_({
                    id: 'sticky-note.media.dialog.full-width-help',
                    message: 'The image or video spans the available width of the sticky note.',
                  })}
                </p>
              </div>
            </div>

            {parsed.ok && (
              <div className="rounded-md border border-border-subtle bg-surface p-3">
                <div
                  className="mx-auto max-w-full overflow-hidden rounded"
                  style={{ width: fullWidth ? '100%' : 'min(320px, 100%)' }}
                >
                  {previewState === 'failed' ? (
                    <div
                      role="alert"
                      className="flex min-h-24 items-center justify-center bg-black/10 px-3 text-center text-xs text-foreground-muted"
                    >
                      {_({
                        id: 'sticky-note.media.dialog.preview-unavailable',
                        message: 'We could not load a preview for this URL.',
                      })}
                    </div>
                  ) : parsed.value.kind === 'image' ? (
                    <img
                      src={parsed.value.url}
                      alt={
                        alt.trim() ||
                        _({
                          id: 'sticky-note.media.dialog.image-preview',
                          message: 'Image preview',
                        })
                      }
                      referrerPolicy="no-referrer"
                      className="block h-auto max-w-full"
                      style={{ width: fullWidth ? '100%' : 'auto' }}
                      onLoad={() => setPreviewState('loaded')}
                      onError={() => setPreviewState('failed')}
                    />
                  ) : parsed.value.kind === 'publicVideo' ? (
                    // biome-ignore lint/a11y/useMediaCaption: Consumers provide one public video URL, not a separate caption track.
                    <video
                      src={parsed.value.url}
                      aria-label={_({
                        id: 'sticky-note.media.dialog.video-preview',
                        message: 'Video preview',
                      })}
                      controls
                      preload="metadata"
                      playsInline
                      className="block h-auto w-full bg-black"
                      onLoadedMetadata={() => setPreviewState('loaded')}
                      onError={() => setPreviewState('failed')}
                    >
                      {_({
                        id: 'sticky-note.media.video-unavailable',
                        message: 'Video playback is unavailable.',
                      })}
                    </video>
                  ) : (
                    <img
                      src={`https://i.ytimg.com/vi/${parsed.value.videoId}/hqdefault.jpg`}
                      alt={_({
                        id: 'sticky-note.media.dialog.video-preview',
                        message: 'Video preview',
                      })}
                      referrerPolicy="no-referrer"
                      className="block aspect-video w-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              {_({ id: 'sticky-note.media.dialog.cancel', message: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isEditing
                ? _({ id: 'sticky-note.media.dialog.save', message: 'Save changes' })
                : _({ id: 'sticky-note.media.dialog.embed', message: 'Embed media' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
