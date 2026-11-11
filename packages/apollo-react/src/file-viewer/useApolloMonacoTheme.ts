import { apolloFutureDarkMonaco, apolloFutureLightMonaco } from '@uipath/apollo-wind/editor-themes';
import { useEffect } from 'react';

import type { MonacoApi } from './useMonaco';

export type FileViewerTheme = 'light' | 'dark';

export const MONACO_THEME_NAME = {
  light: 'apollo-future-light',
  dark: 'apollo-future-dark',
} as const satisfies Record<FileViewerTheme, string>;

const themedInstances = new WeakSet<MonacoApi>();

type ApolloMonacoTheme = typeof apolloFutureLightMonaco | typeof apolloFutureDarkMonaco;

/** apollo-wind's themes are `as const`; Monaco's `defineTheme` wants a mutable rules array. */
const toThemeData = (theme: ApolloMonacoTheme) => ({ ...theme, rules: [...theme.rules] });

function defineApolloThemes(monaco: MonacoApi): void {
  if (themedInstances.has(monaco)) {
    return;
  }
  monaco.editor.defineTheme(MONACO_THEME_NAME.light, toThemeData(apolloFutureLightMonaco));
  monaco.editor.defineTheme(MONACO_THEME_NAME.dark, toThemeData(apolloFutureDarkMonaco));
  themedInstances.add(monaco);
}

/**
 * Registers the Apollo themes and applies `theme`. Call it before the effect that creates the
 * editor: effects run in order, so the theme exists by then. Monaco has one theme per page, so
 * every editor on it follows the last one set.
 */
export function useApolloMonacoTheme(monaco: MonacoApi, theme: FileViewerTheme): void {
  useEffect(() => {
    defineApolloThemes(monaco);
    monaco.editor.setTheme(MONACO_THEME_NAME[theme]);
  }, [monaco, theme]);
}
