import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type ApChatTheme, AutopilotChatService } from '../../service';
import { AutopilotChatServiceProvider } from './chat-service.provider';
import { ThemeProvider, useTheme } from './theme-provider';

let instanceCounter = 0;
let current: ReturnType<typeof useTheme> | undefined;

function Probe() {
  current = useTheme();
  return null;
}

function setup(initialTheme: ApChatTheme) {
  const service = AutopilotChatService.Instantiate({
    instanceName: `theme-${++instanceCounter}`,
  });
  render(
    <AutopilotChatServiceProvider chatServiceInstance={service}>
      <ThemeProvider initialTheme={initialTheme}>
        <Probe />
      </ThemeProvider>
    </AutopilotChatServiceProvider>
  );
  return service;
}

describe('ThemeProvider', () => {
  it.each([
    ['light', false],
    ['light-hc', false],
    ['future-light', false],
    ['dark', true],
    ['dark-hc', true],
    ['future-dark', true],
  ] as const)('reports %s as dark: %s', (theme, isDark) => {
    setup(theme);

    expect(current).toEqual({ theme, isDark });
  });

  it('follows the service theme', () => {
    const service = setup('light');

    act(() => service.setTheme('future-dark'));

    expect(current).toEqual({ theme: 'future-dark', isDark: true });
  });
});
