import { act, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type AutopilotChatConfiguration, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from '../providers/chat-service.provider';
import { useWelcomeContent } from './use-welcome-content';

let instanceCounter = 0;

function Place({ name }: { name: string }) {
  const host = React.useRef<HTMLDivElement>(null);
  useWelcomeContent(host);
  return <div ref={host} data-place={name} />;
}

function setup(welcomeContent: AutopilotChatConfiguration['welcomeContent']) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `use-welcome-content-${++instanceCounter}`,
    config: { welcomeContent } as AutopilotChatConfiguration,
  });
  const tree = (place: React.ReactNode) => (
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      {place}
    </AutopilotChatServiceProvider>
  );
  const view = render(tree(null));
  // The hide runs in a microtask after the commit; an async act waits for it.
  const show = (place: React.ReactNode) => act(async () => view.rerender(tree(place)));
  return { service, show, hide: () => show(null) };
}

const place = (name: string) => document.querySelector(`[data-place="${name}"]`);

describe('useWelcomeContent', () => {
  it('hands the same container over once per display and empties it on hide', async () => {
    const cleanup = vi.fn();
    const welcomeContent = vi.fn((container: HTMLElement) => {
      container.append(document.createElement('form'));
      return cleanup;
    });
    const { show, hide } = setup(welcomeContent);
    expect(welcomeContent).not.toHaveBeenCalled();

    await show(<Place name="a" />);
    const container = welcomeContent.mock.calls[0]![0];
    expect(welcomeContent).toHaveBeenCalledTimes(1);
    expect(place('a')?.firstElementChild).toBe(container);
    expect(container.children).toHaveLength(1);

    // A render of the same place is not another display.
    await show(<Place name="a" />);
    expect(welcomeContent).toHaveBeenCalledTimes(1);

    await hide();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(container.children).toHaveLength(0);

    await show(<Place name="a" />);
    expect(welcomeContent).toHaveBeenCalledTimes(2);
    expect(welcomeContent.mock.calls[1]![0]).toBe(container);
    expect(place('a')?.firstElementChild).toBe(container);
    expect(container.children).toHaveLength(1);
  });

  it('runs the cleanup before the container is emptied', async () => {
    let childrenAtCleanup = -1;
    const { show, hide } = setup((container) => {
      container.append(document.createElement('form'));
      return () => {
        childrenAtCleanup = container.children.length;
      };
    });

    await show(<Place name="a" />);
    await hide();

    expect(childrenAtCleanup).toBe(1);
  });

  it('moves the container with its content to a place that mounts as another unmounts', async () => {
    const cleanup = vi.fn();
    const welcomeContent = vi.fn((container: HTMLElement) => {
      container.append(document.createElement('form'));
      return cleanup;
    });
    const { show } = setup(welcomeContent);

    await show(<Place key="a" name="a" />);
    const container = welcomeContent.mock.calls[0]![0];
    const form = container.firstElementChild;
    await show(<Place key="b" name="b" />);

    expect(welcomeContent).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    expect(place('b')?.firstElementChild).toBe(container);
    expect(container.firstElementChild).toBe(form);
  });

  it('gives the container back to the place that stays when a later one unmounts', async () => {
    const cleanup = vi.fn();
    const welcomeContent = vi.fn((container: HTMLElement) => {
      container.append(document.createElement('form'));
      return cleanup;
    });
    const { show } = setup(welcomeContent);

    await show(
      <>
        <Place key="a" name="a" />
        <Place key="b" name="b" />
      </>
    );
    const container = welcomeContent.mock.calls[0]![0];
    expect(place('b')?.firstElementChild).toBe(container);

    await show(<Place key="a" name="a" />);

    expect(place('a')?.firstElementChild).toBe(container);
    expect(container.children).toHaveLength(1);
    expect(welcomeContent).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('renders once under StrictMode', async () => {
    const cleanup = vi.fn();
    const welcomeContent = vi.fn((container: HTMLElement) => {
      container.append(document.createElement('form'));
      return cleanup;
    });
    const { show } = setup(welcomeContent);

    await show(
      <React.StrictMode>
        <Place name="a" />
      </React.StrictMode>
    );

    expect(welcomeContent).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    expect(place('a')?.firstElementChild?.children).toHaveLength(1);
  });

  it('does not render again when the host passes another function', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { service, show, hide } = setup(first);
    await show(<Place name="a" />);

    await act(async () => service.patchConfig({ welcomeContent: second }));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    // The next display uses the latest one.
    await hide();
    await show(<Place name="a" />);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('survives a failing renderer and a failing cleanup', async () => {
    let fail = true;
    const welcomeContent = vi.fn((container: HTMLElement) => {
      container.append(document.createElement('form'));
      if (fail) {
        throw new Error('host failed');
      }
      return () => {
        throw new Error('host cleanup failed');
      };
    });
    const { show, hide } = setup(welcomeContent);

    await expect(show(<Place name="a" />)).resolves.not.toThrow();
    const container = welcomeContent.mock.calls[0]![0];
    expect(container.children).toHaveLength(0);

    await hide();
    fail = false;
    await show(<Place name="a" />);
    expect(container.children).toHaveLength(1);

    await expect(hide()).resolves.not.toThrow();
    expect(container.children).toHaveLength(0);
  });
});
