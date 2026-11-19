import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type ApChatTheme,
  type AutopilotChatConfiguration,
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatService,
} from '../../index';
import { type HeroImage, resolveHeroImageHeight, resolveHeroImageUrl } from './hero-branding';

let instanceCounter = 0;
const LIGHT = 'https://cdn.example.com/agent-light.png';
const DARK = 'https://cdn.example.com/agent-dark.png';
const IMAGE: HeroImage = { light: LIGHT, dark: DARK, alt: 'Acme agent' };
const FIRST_RUN = {
  title: 'Welcome to Acme',
  description: 'Ask about your orders.',
  suggestions: [{ label: 'Track an order', prompt: 'Where is my order?' }],
};

const embeddedContainers: HTMLElement[] = [];

function setup({
  image,
  theme,
  embedded = false,
  config = {},
}: {
  image?: Partial<HeroImage>;
  theme?: ApChatTheme;
  embedded?: boolean;
  config?: Partial<AutopilotChatConfiguration>;
} = {}) {
  let embeddedContainer: HTMLElement | undefined;
  if (embedded) {
    embeddedContainer = document.createElement('div');
    document.body.appendChild(embeddedContainer);
    embeddedContainers.push(embeddedContainer);
  }
  const service = AutopilotChatService.Instantiate({
    instanceName: `wind-hero-branding-${++instanceCounter}`,
    config: {
      mode: embedded ? AutopilotChatMode.Embedded : AutopilotChatMode.FullScreen,
      embeddedContainer,
      renderer: 'wind',
      // A copy, as a host passes its own object: load failures are remembered per image object.
      firstRunExperience: { ...FIRST_RUN, image: image && ({ ...image } as HeroImage) },
      ...config,
    },
  });
  const view = render(<ApChat chatServiceInstance={service} theme={theme} />);
  return { service, view };
}

const IMAGE_ONLY = { title: '', description: '' };
const hero = () => document.querySelector('[data-slot="chat-hero"]') as HTMLElement;
const firstRun = () => document.querySelector('[data-first-run]');
const heroImage = () => hero().querySelector<HTMLImageElement>('[data-slot="chat-hero-image"]');
const logoSlot = () => hero().querySelector('[data-slot="chat-hero-logo"]');
const autopilotLogo = () => logoSlot()?.querySelector('svg') ?? null;

afterEach(() => {
  for (const container of embeddedContainers.splice(0)) container.remove();
  vi.restoreAllMocks();
});

describe('resolveHeroImageUrl', () => {
  it('uses the dark variant in a dark theme and the light one otherwise', () => {
    expect(resolveHeroImageUrl(IMAGE, false)).toBe(LIGHT);
    expect(resolveHeroImageUrl(IMAGE, true)).toBe(DARK);
  });

  it('uses the light image in a dark theme when there is no dark one', () => {
    expect(resolveHeroImageUrl({ light: LIGHT, alt: '' }, true)).toBe(LIGHT);
    expect(resolveHeroImageUrl({ light: LIGHT, dark: '', alt: '' }, true)).toBe(LIGHT);
  });

  it('accepts http, https and relative URLs', () => {
    for (const light of ['http://example.com/a.png', LIGHT, '/assets/a.png', 'assets/a.png']) {
      expect(resolveHeroImageUrl({ light, alt: '' }, false)).toBe(light);
    }
  });

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:image/png;base64,AAAA',
    'blob:https://example.com/5b1d',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '',
    '   ',
  ])('refuses %j', (light) => {
    expect(resolveHeroImageUrl({ light, alt: '' }, false)).toBeUndefined();
  });

  it('refuses a value that is not a string', () => {
    expect(resolveHeroImageUrl({ light: 42, alt: '' } as unknown as HeroImage, false)).toBe(
      undefined
    );
  });

  it('does not fall back to the light image when the dark one is refused', () => {
    expect(
      resolveHeroImageUrl({ light: LIGHT, dark: 'data:image/png;base64,AAAA', alt: '' }, true)
    ).toBeUndefined();
  });
});

describe('resolveHeroImageHeight', () => {
  it('takes a positive number of pixels', () => {
    expect(resolveHeroImageHeight({ ...IMAGE, height: 48 })).toBe(48);
    expect(resolveHeroImageHeight({ ...IMAGE, height: 37.5 })).toBe(37.5);
  });

  it.each([
    undefined,
    0,
    -40,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '48',
    '48px',
    '100%;background:url(https://example.com/x)',
    null,
    {},
  ])('ignores %j', (height) => {
    expect(resolveHeroImageHeight({ ...IMAGE, height } as unknown as HeroImage)).toBeUndefined();
  });
});

describe('first-run image configuration', () => {
  it('reaches the service config from initialization, the setter and a config patch', () => {
    const { service } = setup({ image: IMAGE });
    expect(service.getConfig().firstRunExperience?.image).toEqual(IMAGE);

    const published = vi.fn();
    service.on(AutopilotChatEvent.SetFirstRunExperience, published);
    const next = { ...FIRST_RUN, image: { light: DARK, alt: 'Acme' } };
    act(() => service.setFirstRunExperience(next));
    expect(published).toHaveBeenCalledWith(next);
    expect(heroImage()).toHaveAttribute('src', DARK);

    act(() => service.patchConfig({ readOnly: false }));
    expect(service.getConfig().firstRunExperience?.image).toEqual(next.image);
    expect(heroImage()).toHaveAttribute('src', DARK);

    const patched = { ...FIRST_RUN, image: { light: LIGHT, alt: 'Patched' } };
    act(() => service.patchConfig({ firstRunExperience: patched }));
    expect(service.getConfig().firstRunExperience?.image).toEqual(patched.image);
    expect(heroImage()).toHaveAttribute('src', LIGHT);
    expect(heroImage()).toHaveAttribute('alt', 'Patched');

    act(() => service.setFirstRunExperience(FIRST_RUN));
    expect(heroImage()).toBeNull();
    expect(autopilotLogo()).not.toBeNull();
  });
});

describe('Wind first-run branding', () => {
  it('shows the Autopilot logo in FullScreen and no logo in Embedded without an image', () => {
    const { view } = setup();
    expect(autopilotLogo()).not.toBeNull();
    expect(heroImage()).toBeNull();
    view.unmount();

    setup({ embedded: true });
    expect(hero()).toHaveAttribute('data-layout', 'docked');
    expect(logoSlot()).toBeNull();
  });

  it('shows the image above the title and description in FullScreen', () => {
    setup({ image: IMAGE });

    const image = heroImage()!;
    expect(image).toHaveAttribute('src', LIGHT);
    expect(image).toHaveAttribute('alt', 'Acme agent');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(logoSlot()?.contains(image)).toBe(true);
    expect(autopilotLogo()).toBeNull();
    const title = within(hero()).getByRole('heading', { name: 'Welcome to Acme' });
    expect(image.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hero()).toHaveTextContent('Ask about your orders.');
  });

  it('shows the image in Embedded too', () => {
    setup({ image: IMAGE, embedded: true });

    expect(hero()).toHaveAttribute('data-layout', 'docked');
    expect(heroImage()).toHaveAttribute('src', LIGHT);
    expect(within(hero()).getByRole('heading', { name: 'Welcome to Acme' })).toBeInTheDocument();
    expect(hero()).toHaveTextContent('Ask about your orders.');
  });

  it.each([
    ['FullScreen', false, false, 'max-h-60'],
    ['compact FullScreen', false, true, 'max-h-40'],
    ['Embedded', true, false, 'max-h-40'],
    ['compact Embedded', true, true, 'max-h-30'],
  ])('keeps the image its own size, capped to fit in %s', (_name, embedded, compactMode, cap) => {
    setup({ image: IMAGE, embedded, config: { spacing: { compactMode } } });

    expect(hero()).toHaveAttribute('data-density', compactMode ? 'compact' : 'comfortable');
    // No width or height of its own, so a small image is not enlarged.
    expect(heroImage()).toHaveClass('h-auto', 'w-auto', 'max-w-full', cap);
    expect(heroImage()).not.toHaveAttribute('width');
    expect(heroImage()).not.toHaveAttribute('height');
  });

  it('shows the image at the configured height, still capped to fit', () => {
    setup({ image: { ...IMAGE, height: 48 }, embedded: true });

    expect(heroImage()).toHaveClass('h-(--hero-image-height)', 'w-auto', 'max-w-full', 'max-h-40');
    expect(heroImage()).not.toHaveClass('h-auto');
    expect(logoSlot()).toHaveStyle({ '--hero-image-height': '48px' });
  });

  it('ignores a height that is not a positive number', () => {
    setup({
      image: {
        ...IMAGE,
        height: '100%;background:url(https://example.com/x)',
      } as unknown as HeroImage,
    });

    expect(heroImage()).toHaveClass('h-auto');
    expect(logoSlot()).not.toHaveAttribute('style');
    expect(heroImage()).not.toHaveAttribute('style');
  });

  it('shows the image alone when the title and description are empty', () => {
    setup({ config: { firstRunExperience: { ...IMAGE_ONLY, image: { ...IMAGE } } } });

    expect(hero()).toHaveAttribute('data-first-run');
    expect(screen.getByRole('img', { name: 'Acme agent' })).toBe(heroImage());
    expect(within(hero()).queryByRole('heading')).toBeNull();
    expect(hero().querySelector('[data-slot="chat-hero-description"]')).toBeNull();
  });

  it.each<[ApChatTheme, string]>([
    ['light', LIGHT],
    ['light-hc', LIGHT],
    ['future-light', LIGHT],
    ['dark', DARK],
    ['dark-hc', DARK],
    ['future-dark', DARK],
  ])('picks the variant for the %s theme', (theme, src) => {
    setup({ image: IMAGE, theme });

    expect(heroImage()).toHaveAttribute('src', src);
  });

  it('uses the one configured image in every theme', () => {
    setup({ image: { light: LIGHT, alt: '' }, theme: 'dark' });

    expect(heroImage()).toHaveAttribute('src', LIGHT);
    expect(heroImage()).toHaveAttribute('alt', '');
  });

  it('switches the variant when the theme changes at runtime', () => {
    const { service } = setup({ image: IMAGE, theme: 'light' });
    expect(heroImage()).toHaveAttribute('src', LIGHT);

    act(() => service.setTheme('dark'));
    expect(heroImage()).toHaveAttribute('src', DARK);

    act(() => service.setTheme('future-light'));
    expect(heroImage()).toHaveAttribute('src', LIGHT);
  });

  it('switches the variant when the theme prop changes', () => {
    const { service, view } = setup({ image: IMAGE, theme: 'light' });
    expect(heroImage()).toHaveAttribute('src', LIGHT);

    view.rerender(<ApChat chatServiceInstance={service} theme="dark-hc" />);
    expect(heroImage()).toHaveAttribute('src', DARK);
  });

  it.each([
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'blob:https://example.com/5b1d',
    '',
  ])('is as without an image for the refused URL %j, without logging', (light) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    setup({ image: { light, alt: 'Acme agent' } });

    expect(heroImage()).toBeNull();
    expect(hero().querySelector('img')).toBeNull();
    expect(autopilotLogo()).not.toBeNull();
    expect(within(hero()).getByRole('heading', { name: 'Welcome to Acme' })).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('shows no logo in Embedded for a refused URL, as without an image', () => {
    setup({ image: { light: 'data:image/png;base64,AAAA', alt: '' }, embedded: true });

    expect(hero().querySelector('img')).toBeNull();
    expect(logoSlot()).toBeNull();
    expect(within(hero()).getByRole('heading', { name: 'Welcome to Acme' })).toBeInTheDocument();
  });

  it('is as without an image when the image fails to load', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { view } = setup({ image: IMAGE });

    fireEvent.error(heroImage()!);

    expect(heroImage()).toBeNull();
    expect(autopilotLogo()).not.toBeNull();
    expect(within(hero()).getByRole('heading', { name: 'Welcome to Acme' })).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
    view.unmount();

    setup({ image: IMAGE, embedded: true });
    fireEvent.error(heroImage()!);
    expect(hero().querySelector('img')).toBeNull();
    expect(logoSlot()).toBeNull();
  });

  it('tries the other variant after one fails, and neither again once both have', () => {
    const { service } = setup({ image: IMAGE, theme: 'light' });
    fireEvent.error(heroImage()!);
    expect(heroImage()).toBeNull();

    act(() => service.setTheme('dark'));
    expect(heroImage()).toHaveAttribute('src', DARK);
    fireEvent.error(heroImage()!);

    act(() => service.setTheme('light'));
    expect(heroImage()).toBeNull();
    act(() => service.setTheme('dark'));
    expect(heroImage()).toBeNull();
  });

  it('tries again when the host sets the image again', () => {
    const { service } = setup({ image: IMAGE });
    fireEvent.error(heroImage()!);
    expect(heroImage()).toBeNull();

    act(() => service.setFirstRunExperience({ ...FIRST_RUN, image: { ...IMAGE } }));
    expect(heroImage()).toHaveAttribute('src', LIGHT);
  });

  it.each([
    ['FullScreen', false],
    ['Embedded', true],
  ])('shows no first run for an image alone that is refused in %s', (_name, embedded) => {
    setup({
      embedded,
      config: {
        firstRunExperience: {
          ...IMAGE_ONLY,
          image: { light: 'data:image/png;base64,AAAA', alt: '' },
        },
      },
    });

    expect(firstRun()).toBeNull();
    expect(document.querySelector('[data-slot="chat-hero-logo"]')).toBeNull();
  });

  it('drops the first run of an image alone when the image fails to load', () => {
    setup({ config: { firstRunExperience: { ...IMAGE_ONLY, image: { ...IMAGE } } } });
    expect(firstRun()).not.toBeNull();

    fireEvent.error(heroImage()!);

    expect(firstRun()).toBeNull();
    expect(document.querySelector('[data-slot="chat-hero-logo"]')).toBeNull();
  });

  it('gives way to the transcript like any first run', () => {
    const { service } = setup({
      config: { firstRunExperience: { ...IMAGE_ONLY, image: { ...IMAGE } } },
    });
    expect(firstRun()).not.toBeNull();

    act(() =>
      service.sendResponse({ content: 'Hello', widget: 'apollo-markdown-renderer', created_at: '' })
    );

    expect(firstRun()).toBeNull();
  });

  it('is ignored by the Material renderer', async () => {
    setup({ image: IMAGE, config: { renderer: 'material' } });

    // Material loads on demand.
    expect(await screen.findByText('Welcome to Acme', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
