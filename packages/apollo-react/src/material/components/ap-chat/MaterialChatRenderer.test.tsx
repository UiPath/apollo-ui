import { describe, expect, it } from 'vitest';

import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeFutureDark,
  apolloMaterialUiThemeFutureLight,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from '../../theme';
import { MUI_THEME_MAP } from './MaterialChatRenderer';

describe('MUI_THEME_MAP', () => {
  it('gives every chat theme its MUI theme, the future themes included', () => {
    expect(MUI_THEME_MAP).toEqual({
      light: apolloMaterialUiThemeLight,
      dark: apolloMaterialUiThemeDark,
      'light-hc': apolloMaterialUiThemeLightHC,
      'dark-hc': apolloMaterialUiThemeDarkHC,
      'future-light': apolloMaterialUiThemeFutureLight,
      'future-dark': apolloMaterialUiThemeFutureDark,
    });
    expect(MUI_THEME_MAP['future-dark'].palette.mode).toBe('dark');
    expect(MUI_THEME_MAP['future-light'].palette.mode).toBe('light');
  });
});
