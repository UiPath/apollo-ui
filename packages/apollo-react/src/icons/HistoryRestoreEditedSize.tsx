// Auto-generated from action/history-restore-edited-size.svg
import React from 'react';

export interface HistoryRestoreEditedSizeProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const HistoryRestoreEditedSize = React.forwardRef<SVGSVGElement, HistoryRestoreEditedSizeProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M13.7139 2C19.3939 2 24 6.60613 24 12.2861C23.9998 17.9659 19.3937 22.5713 13.7139 22.5713C10.8683 22.5712 8.30808 21.4175 6.44531 19.5547L8.06836 17.9316C9.50827 19.383 11.5083 20.286 13.7139 20.2861C18.1366 20.2861 21.7136 16.7088 21.7139 12.2861C21.7139 7.86328 18.1367 4.28613 13.7139 4.28613C9.2912 4.28636 5.71387 7.86342 5.71387 12.2861H9.14258L4.52539 16.8916L4.44531 16.7314L0 12.2861H3.42871C3.42871 6.60627 8.03406 2.00023 13.7139 2ZM14.2861 7.71387V12.457L18.3086 14.8457L17.4287 16.3086L12.5713 13.4287V7.71387H14.2861Z" fill="currentColor"/>
    </svg>
  )
);

HistoryRestoreEditedSize.displayName = 'HistoryRestoreEditedSize';

export default HistoryRestoreEditedSize;
