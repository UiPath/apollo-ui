// Auto-generated from studio-activities-icon-sets/activities-generic-activity-icons/generic-activity-icons-list-all.svg
import React from 'react';

export interface GenericActivityIconsListAllProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const GenericActivityIconsListAll = React.forwardRef<
  SVGSVGElement,
  GenericActivityIconsListAllProps
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
    <g clipPath="url(#clip0_4117_2180)">
      <path
        d="M20.0996 3C20.4996 3 21 3.40039 21 3.90039V20.0996C21 20.4996 20.4996 21 20.0996 21H3.90039C3.40039 21 3 20.4996 3 20.0996V3.90039C3 3.40039 3.40039 3 3.90039 3H20.0996ZM5 5V19H19V5H5ZM9 15V17H7V15H9ZM17 15V17H11V15H17ZM9 11V13H7V11H9ZM17 11V13H11V11H17ZM9 7V9H7V7H9ZM17 7V9H11V7H17Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_4117_2180">
        <rect width="24" height="24" fill="var(--color-foreground)" />
      </clipPath>
    </defs>
  </svg>
));

GenericActivityIconsListAll.displayName = 'GenericActivityIconsListAll';

export default GenericActivityIconsListAll;
