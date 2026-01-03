// Auto-generated from editor/cropp.svg
import React from 'react';

export interface CroppProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Cropp = React.forwardRef<SVGSVGElement, CroppProps>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 1V17H23V19H19V23H17V19H7C5.9 19 5 18.1 5 17V7H1V5H5V1H7ZM19 15H17V7H9V5H17C18.1 5 19 5.9 19 7V15Z"
      fill="currentColor"
    />
  </svg>
));

Cropp.displayName = 'Cropp';

export default Cropp;
