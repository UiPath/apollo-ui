import { PaintBrushIcon } from '@storybook/icons';
// biome-ignore lint/correctness/noUnusedImports: needed for JSX
import React, { useEffect } from 'react';
import { IconButton, TooltipLinkList, WithTooltip } from 'storybook/internal/components';
import { addons, types, useGlobals, useParameter } from 'storybook/manager-api';
import theme from './theme';
import {
  ALL_THEME_ITEMS,
  clampThemeForMaterial,
  DEFAULT_THEME,
  MATERIAL_THEME_ITEMS,
  MATERIAL_THEMES,
  type ThemeMode,
} from './themes';

addons.setConfig({
  theme,
  sidebar: {
    collapsedRoots: [],
  },
});

/**
 * Custom theme selector tool.
 *
 * Replaces the globalTypes-driven toolbar so the item list can react to the
 * active story: Material stories (`parameters.material`) only support the six
 * core themes, so the Wind-only demo themes (wireframe/vertex/canvas) are
 * hidden there. Landing on a Material story while a demo theme is active
 * auto-switches to its closest Material-supported theme.
 */
const ThemeSelector = () => {
  const [globals, updateGlobals] = useGlobals();
  const isMaterial = useParameter('material', false) === true;
  const selected = (globals.theme ?? DEFAULT_THEME) as ThemeMode;

  useEffect(() => {
    if (isMaterial && !MATERIAL_THEMES.includes(selected)) {
      updateGlobals({ theme: clampThemeForMaterial(selected) });
    }
  }, [isMaterial, selected, updateGlobals]);

  const items = isMaterial ? MATERIAL_THEME_ITEMS : ALL_THEME_ITEMS;
  const selectedTitle = ALL_THEME_ITEMS.find((item) => item.value === selected)?.title ?? selected;

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      closeOnOutsideClick
      tooltip={({ onHide }) => (
        <TooltipLinkList
          links={items.map((item) => ({
            id: item.value,
            title: item.title,
            active: item.value === selected,
            onClick: () => {
              updateGlobals({ theme: item.value });
              onHide();
            },
          }))}
        />
      )}
    >
      <IconButton key="theme-selector" title="Toggle design language theme">
        <PaintBrushIcon />
        &nbsp;{selectedTitle}
      </IconButton>
    </WithTooltip>
  );
};

addons.register('apollo/theme-selector', () => {
  addons.add('apollo/theme-selector/tool', {
    type: types.TOOL,
    title: 'Theme',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: ThemeSelector,
  });
});
