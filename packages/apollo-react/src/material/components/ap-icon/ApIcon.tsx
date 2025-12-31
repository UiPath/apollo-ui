import React from 'react';

import { Icon, SvgIcon } from '@mui/material';
import token from '@uipath/apollo-core';

import * as LegacyIcons from './assets/index';
import type { ApIconProps } from './ApIcon.types';

// Convert snake_case to PascalCase for legacy icon lookup
const snakeToPascal = (str: string): string =>
  str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

export const ApIcon: React.FC<ApIconProps> = ({
  name,
  size,
  color,
  variant = 'normal',
}) => {
  // Handle Material Icons (when variant is 'outlined' or 'normal')
  if (variant === 'outlined' || variant === 'normal') {
    return (
      <Icon
        className={variant === 'outlined' ? 'material-icons-outlined' : 'material-icons'}
        sx={{
          fontSize: size || token.Icon.IconM,
          color: color || 'currentColor',
        }}
      >
        {name}
      </Icon>
    );
  }

  // Handle custom icons - check legacy icons first (snake_case names)
  const legacyIconName = snakeToPascal(name);

  const LegacyIconComponent = (LegacyIcons as any)[legacyIconName];
  if (LegacyIconComponent) {
    return (
      <SvgIcon
        component={LegacyIconComponent}
        sx={{
          fontSize: size || token.Icon.IconM,
          color: color || 'currentColor',
        }}
      />
    );
  }

  console.warn(`Icon "${name}" not found in legacy or core icons`);
  return null;
};
