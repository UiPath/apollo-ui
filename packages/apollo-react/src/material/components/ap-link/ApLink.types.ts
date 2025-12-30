import React from 'react';
import { FontVariantToken } from '@uipath/apollo-core';

export type LinkTarget = '_self' | '_blank' | '_parent' | '_top';

export interface ApLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** URL to navigate to */
  href?: string;
  /** Target window/tab */
  target?: LinkTarget;
  /** Accessible label for the link */
  label?: string;
  /** Text color (CSS variable or hex) */
  color?: string;
  /** Typography variant */
  variant?: FontVariantToken;
  /** Test ID for testing */
  'data-testid'?: string;
}
