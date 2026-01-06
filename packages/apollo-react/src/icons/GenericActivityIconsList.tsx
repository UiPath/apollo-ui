// Auto-generated from studio-activities-icon-sets/activities-generic-activity-icons/generic-activity-icons-list.svg
import React from 'react';

export interface GenericActivityIconsListProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const GenericActivityIconsList = React.forwardRef<SVGSVGElement, GenericActivityIconsListProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_2178)">
<path d="M3 15H5V13H3V15Z" fill="currentColor"/>
<path d="M3 19H5V17H3V19Z" fill="currentColor"/>
<path d="M3 11H5V9H3V11Z" fill="currentColor"/>
<path d="M7 15H21V13H7V15Z" fill="currentColor"/>
<path d="M7 19H21V17H7V19Z" fill="currentColor"/>
<path d="M7 9V11H21V9H7Z" fill="currentColor"/>
<path d="M3 7H5V5H3V7Z" fill="currentColor"/>
<path d="M7 5V7H21V5H7Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_2178">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

GenericActivityIconsList.displayName = 'GenericActivityIconsList';

export default GenericActivityIconsList;
