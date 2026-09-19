import type React from 'react';

import type { StatusTypes } from '../../../types/statusTypes';

export enum BadgeSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface ApBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The text label to display in the badge */
  label: string;
  /** Size variant of the badge (default: small) */
  size?: BadgeSize;
  /** Status/semantic color variant (default: default) */
  status?: StatusTypes;
  /** Optional leading element, sized by the badge. Decorative: give the badge a title or aria-label if it carries meaning. */
  icon?: React.ReactElement;
}
