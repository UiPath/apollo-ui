import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
// biome-ignore lint/correctness/noUnusedImports: needed for JSX
import React, { type PropsWithChildren, useEffect, useState } from 'react';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { themes } from 'storybook/theming';
import { ALL_THEMES, DEFAULT_THEME, type ThemeMode } from './themes';

const DARK_THEMES: ThemeMode[] = ['dark', 'dark-hc', 'future-dark', 'vertex', 'canvas'];

/**
 * Read the current `theme` global off the preview channel. Docs pages have no
 * story context, so the channel's last globals event is the source of truth.
 */
function themeFromChannel(channel: DocsContainerProps['context']['channel']): ThemeMode {
  const updated = channel.last(GLOBALS_UPDATED)?.[0]?.globals?.theme;
  const initial = channel.last(SET_GLOBALS)?.[0]?.globals?.theme;
  const theme = updated ?? initial ?? DEFAULT_THEME;
  return (ALL_THEMES as string[]).includes(theme) ? (theme as ThemeMode) : DEFAULT_THEME;
}

/**
 * Theme-aware docs container.
 *
 * Addon-docs paints the docs page background from its own Storybook theme,
 * which is static by default — so docs pages stayed light regardless of the
 * Apollo theme selected in the toolbar. This wrapper follows the `theme`
 * global and:
 * - passes a matching dark/light docs theme to `DocsContainer`, and
 * - applies the Apollo theme class to <body> (MDX-only pages render no story,
 *   so the preview decorator that normally does this never runs there).
 */
export const ApolloDocsContainer = ({
  children,
  context,
}: PropsWithChildren<DocsContainerProps>) => {
  const [theme, setTheme] = useState<ThemeMode>(() => themeFromChannel(context.channel));

  useEffect(() => {
    const onGlobalsUpdated = ({ globals }: { globals: { theme?: string } }) => {
      if (globals.theme && (ALL_THEMES as string[]).includes(globals.theme)) {
        setTheme(globals.theme as ThemeMode);
      }
    };
    context.channel.on(GLOBALS_UPDATED, onGlobalsUpdated);
    return () => {
      context.channel.off(GLOBALS_UPDATED, onGlobalsUpdated);
    };
  }, [context.channel]);

  // Same body-class contract as the preview decorator (see preview.tsx).
  useEffect(() => {
    const body = document.body;
    body.classList.remove(...ALL_THEMES);
    body.classList.add(theme);
    return () => {
      body.classList.remove(...ALL_THEMES);
    };
  }, [theme]);

  const docsTheme = DARK_THEMES.includes(theme) ? themes.dark : themes.light;

  return (
    <DocsContainer context={context} theme={docsTheme}>
      {children}
    </DocsContainer>
  );
};
