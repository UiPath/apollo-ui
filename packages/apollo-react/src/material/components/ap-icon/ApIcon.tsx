import { Icon, SvgIcon } from '@mui/material';
import token from '@uipath/apollo-core';
import type React from 'react';
import type { ApIconProps } from './ApIcon.types';
import * as LegacyIcons from './assets/index';

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
  style,
  'data-testid': testId,
}) => {
  // Handle Material Icons (when variant is 'outlined' or 'normal')
  if (variant === 'outlined' || variant === 'normal') {
    return (
      <Icon
        className={variant === 'outlined' ? 'material-icons-outlined' : 'material-icons'}
        data-testid={testId || 'ap-icon'}
        data-name={name}
        sx={{
          fontSize: size || token.Icon.IconM,
          color: color || 'currentColor',
        }}
        style={style}
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
        data-testid={testId || 'ap-icon'}
        data-name={name}
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
