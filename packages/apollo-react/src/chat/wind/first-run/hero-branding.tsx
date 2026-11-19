import { type ChatHeroDensity, type ChatHeroLayout, ChatHeroLogo, cn } from '@uipath/apollo-wind';
import React from 'react';

import { AutopilotLogo } from '../../assets/autopilot-logo';
import { useTheme } from '../../headless/providers/theme-provider';
import { isOpenableUrl } from '../../headless/utils/openable-url';
import type { AutopilotChatConfiguration } from '../../service/ChatModel';

type FirstRunExperience = NonNullable<AutopilotChatConfiguration['firstRunExperience']>;
export type HeroImage = NonNullable<FirstRunExperience['image']>;

/**
 * The image URL for the theme: `dark` in the dark themes when set, otherwise `light`. Undefined
 * when the chosen URL is missing or may not be loaded, so a refused dark variant does not put
 * the light one on a dark background.
 */
export function resolveHeroImageUrl(image: HeroImage, isDark: boolean): string | undefined {
  const url = (isDark && image.dark) || image.light;
  // An empty string would resolve to the page itself.
  return typeof url === 'string' && url.trim() !== '' && isOpenableUrl(url) ? url : undefined;
}

/** The host's `height` in pixels, or undefined for anything but a positive number. */
export function resolveHeroImageHeight(image: HeroImage): number | undefined {
  const { height } = image;
  return typeof height === 'number' && Number.isFinite(height) && height > 0 ? height : undefined;
}

// The image shows at its own size, or at the host's `height`, and is scaled down to the hero's
// width and to this height.
const MAX_HEIGHT: Record<ChatHeroLayout, Record<ChatHeroDensity, string>> = {
  centered: { comfortable: 'max-h-60', compact: 'max-h-40' },
  docked: { comfortable: 'max-h-40', compact: 'max-h-30' },
};

// Load failures, kept by the host's image object, so setting the first run again gives the
// image another attempt. Outside React state because the layouts read it as well, to tell
// whether a first run of only an image shows at all.
const failedUrls = new WeakMap<HeroImage, Set<string>>();
const listeners = new Set<() => void>();
let failureCount = 0;

function markFailed(image: HeroImage, url: string) {
  const failed = failedUrls.get(image) ?? new Set<string>();
  if (failed.has(url)) return;
  failedUrls.set(image, failed.add(url));
  failureCount += 1;
  for (const notify of listeners) notify();
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

const getFailureCount = () => failureCount;

/**
 * The host's `firstRunExperience.image` as the hero shows it in the current theme, or undefined
 * when there is none it can show: not configured, a refused URL, or a URL that failed to load.
 */
export function useHeroImage(image: HeroImage | undefined) {
  const { isDark } = useTheme();
  React.useSyncExternalStore(subscribe, getFailureCount, getFailureCount);
  if (typeof image !== 'object' || image === null) return undefined;
  const url = resolveHeroImageUrl(image, isDark);
  if (url === undefined || failedUrls.get(image)?.has(url)) return undefined;
  return {
    url,
    alt: typeof image.alt === 'string' ? image.alt : '',
    height: resolveHeroImageHeight(image),
    onError: () => markFailed(image, url),
  };
}

/**
 * The logo of the first-run header: the host's image when it can be shown, otherwise what the
 * hero shows without one, the Autopilot logo in the centered layout and nothing in the docked
 * one.
 */
export function HeroBranding({
  image,
  layout,
  density,
}: {
  image: HeroImage | undefined;
  layout: ChatHeroLayout;
  density: ChatHeroDensity;
}) {
  const shown = useHeroImage(image);
  const centered = layout === 'centered';

  if (shown) {
    const { height } = shown;
    return (
      // A block, not the slot's flex row: a flex item capped in height keeps its full width.
      <ChatHeroLogo
        className={cn('block max-w-full', !centered && 'mb-1')}
        style={
          height === undefined
            ? undefined
            : ({ '--hero-image-height': `${height}px` } as React.CSSProperties)
        }
      >
        <img
          src={shown.url}
          alt={shown.alt}
          data-slot="chat-hero-image"
          referrerPolicy="no-referrer"
          decoding="async"
          draggable={false}
          className={cn(
            'block w-auto max-w-full object-contain',
            height === undefined ? 'h-auto' : 'h-(--hero-image-height)',
            // Where the width is what limits an image with a set height.
            !centered && 'object-left',
            MAX_HEIGHT[layout][density]
          )}
          onError={shown.onError}
        />
      </ChatHeroLogo>
    );
  }

  if (!centered) return null;
  return (
    <ChatHeroLogo>
      <AutopilotLogo className="size-10" />
    </ChatHeroLogo>
  );
}
