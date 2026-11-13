import type React from 'react';
import { POPOVER_HEADER_CLASS, POPOVER_ICON_CLASS, POPOVER_TITLE_CLASS } from './sentenceStyles';

export interface PopoverHeaderProps {
  icon: React.ReactNode;
  column: string;
}

/** The popover's title: the column's type glyph, then its name. */
export const PopoverHeader: React.FC<PopoverHeaderProps> = ({ icon, column }) => (
  <div className={POPOVER_HEADER_CLASS}>
    {icon && (
      <span aria-hidden className={POPOVER_ICON_CLASS}>
        {icon}
      </span>
    )}
    <span className={POPOVER_TITLE_CLASS}>{column}</span>
  </div>
);
