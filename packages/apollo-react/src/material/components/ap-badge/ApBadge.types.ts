import React from 'react';

import { StatusTypes } from '../../../types/statusTypes';

export enum BadgeSize {
  SMALL = 'small',
  LARGE = 'large',
}

export interface ApBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The text label to display in the badge */
  label: string;
  /** Size variant of the badge (default: small) */
  size?: BadgeSize;
  /** Status/semantic color variant (default: default) */
  status?: StatusTypes;
}
