import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApChat,
  type AutopilotChatConfiguration,
  type AutopilotChatInfoLink,
  AutopilotChatMode,
  type AutopilotChatRenderer,
  AutopilotChatService,
} from '../../index';

const DISCLAIMER = 'Check important info.';
const LINKS: AutopilotChatInfoLink[] = [
  { label: 'Terms', url: 'https://a.test/terms' },
  { label: 'Privacy policy', url: '/privacy' },
];

let instanceCounter = 0;

// Material is loaded lazily, so the first query waits for it.
async function setup(
  renderer: AutopilotChatRenderer,
  config: Partial<AutopilotChatConfiguration> = {}
) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `composer-footer-${++instanceCounter}`,
    config: {
      mode: AutopilotChatMode.FullScreen,
      renderer,
      overrideLabels: { footerDisclaimer: DISCLAIMER },
      ...config,
    },
  });
  render(<ApChat chatServiceInstance={service} />);
  await screen.findByText(DISCLAIMER, {}, { timeout: 25_000 });
  return service;
}

const link = (name: string) => screen.queryByRole('link', { name });

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each<AutopilotChatRenderer>(['wind', 'material'])('composer footer (%s)', (renderer) => {
  it('shows the disclaimer alone, centered, without info links', async () => {
    await setup(renderer);

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    const disclaimer = screen.getByText(DISCLAIMER);
    if (renderer === 'wind') {
      expect(disclaimer).toHaveAttribute('data-slot', 'chat-composer-footer');
      expect(disclaimer).toHaveClass('text-center', 'text-[10px]');
      expect(document.querySelector('[data-slot="chat-composer-footer-row"]')).toBeNull();
    } else {
      expect(getComputedStyle(disclaimer.parentElement as HTMLElement).textAlign).toBe('center');
    }
  });

  it('opens each link in a new tab, ahead of the disclaimer', async () => {
    await setup(renderer, { infoLinks: LINKS });

    expect(link('Terms')).toHaveAttribute('href', 'https://a.test/terms');
    expect(link('Privacy policy')).toHaveAttribute('href', '/privacy');
    for (const anchor of screen.getAllByRole('link')) {
      expect(anchor).toHaveAttribute('target', '_blank');
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getAllByRole('link').map((anchor) => anchor.textContent)).toEqual([
      'Terms',
      'Privacy policy',
    ]);
    expect(
      (link('Privacy policy') as HTMLElement).compareDocumentPosition(screen.getByText(DISCLAIMER))
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('puts the links after the composer controls in the tab order', async () => {
    await setup(renderer, { infoLinks: LINKS });

    const controls = document.querySelectorAll('button, textarea, [contenteditable="true"]');
    const lastControl = controls[controls.length - 1] as HTMLElement;
    expect(lastControl.compareDocumentPosition(link('Terms') as HTMLElement)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(link('Terms')).not.toHaveAttribute('tabindex');
  });

  it('shows the label of a refused URL as plain text and logs nothing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await setup(renderer, {
      infoLinks: [...LINKS, { label: 'Chat history policy', url: 'javascript:alert(1)' }],
    });

    expect(screen.getByText('Chat history policy')).toBeInTheDocument();
    expect(link('Chat history policy')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(document.querySelector('[href^="javascript" i]')).toBeNull();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('follows setInfoLinks and patchConfig', async () => {
    const service = await setup(renderer);

    act(() => service.setInfoLinks(LINKS));
    expect(screen.getAllByRole('link')).toHaveLength(2);

    act(() => service.patchConfig({ infoLinks: [{ label: 'Help', url: 'https://a.test/help' }] }));
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(link('Help')).toHaveAttribute('href', 'https://a.test/help');

    act(() => service.setInfoLinks([]));
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it('shows a link added to the array it was given before', async () => {
    const hostLinks = [...LINKS];
    const service = await setup(renderer, { infoLinks: hostLinks });

    hostLinks.push({ label: 'Help', url: 'https://a.test/help' });
    act(() => service.setInfoLinks(hostLinks));

    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('removes the links when a new configuration leaves them out', async () => {
    const service = await setup(renderer, { infoLinks: LINKS });

    act(() => service.patchConfig({ infoLinks: undefined }));

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it('gives the new tab no opener when a link is activated from the keyboard', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    await setup(renderer, { infoLinks: LINKS });

    fireEvent.keyDown(link('Terms') as HTMLElement, { key: 'Enter' });

    if (renderer === 'material') {
      // ApLink opens the URL itself on Enter, so it has to repeat the anchor's rel.
      expect(open).toHaveBeenCalledWith('https://a.test/terms', '_blank', 'noopener,noreferrer');
    } else {
      // The anchor's own activation applies its rel.
      expect(open).not.toHaveBeenCalled();
    }
  });

  it('keeps the links when the disclaimer is empty', async () => {
    const service = await setup(renderer, { infoLinks: LINKS });

    act(() => service.setOverrideLabels({ footerDisclaimer: '' }));

    expect(screen.queryByText(DISCLAIMER)).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('hides the links with the footer and in read-only', async () => {
    const service = await setup(renderer, { infoLinks: LINKS });

    act(() => service.setDisabledFeatures({ footer: true }));
    expect(screen.queryByText(DISCLAIMER)).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);

    act(() => service.setDisabledFeatures({ footer: false }));
    expect(screen.getAllByRole('link')).toHaveLength(2);

    act(() => service.setReadOnly(true));
    expect(screen.queryByText(DISCLAIMER)).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('Wind composer footer layout', () => {
  it('keeps the 10px size and wraps links and disclaimer in one row', async () => {
    await setup('wind', { infoLinks: LINKS });

    const row = document.querySelector('[data-slot="chat-composer-footer-row"]');
    expect(row).toHaveClass('flex', 'flex-wrap', 'justify-between', 'text-[10px]');
    expect(row?.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText(DISCLAIMER)).toHaveClass('text-end', 'text-[10px]');
  });
});
