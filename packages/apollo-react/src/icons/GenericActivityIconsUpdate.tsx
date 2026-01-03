// Auto-generated from studio-activities-icon-sets/activities-generic-activity-icons/generic-activity-icons-update.svg
import React from 'react';

export interface GenericActivityIconsUpdateProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const GenericActivityIconsUpdate = React.forwardRef<
  SVGSVGElement,
  GenericActivityIconsUpdateProps
>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <g clipPath="url(#clip0_4117_2164)">
      <path
        d="M21 10H14L16.9502 7.0498C15.6802 5.7898 13.93 5 12 5C8.14 5 5 8.14 5 12C5 15.86 8.14 19 12 19C15.86 19 19 15.86 19 12H21C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C14.49 3 16.7404 4.00965 18.3604 5.63965L21 3V10ZM12.5 8V12.1504L16.0195 14.2402L15.25 15.5195L11 13V8H12.5Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_4117_2164">
        <rect width="24" height="24" fill="var(--color-foreground)" />
      </clipPath>
    </defs>
  </svg>
));

GenericActivityIconsUpdate.displayName = 'GenericActivityIconsUpdate';

export default GenericActivityIconsUpdate;
