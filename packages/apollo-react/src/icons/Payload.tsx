// Auto-generated from studio-icons/payload.svg
import React from 'react';

export interface PayloadProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Payload = React.forwardRef<SVGSVGElement, PayloadProps>(({ size, ...props }, ref) => (
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
      d="M9.6 15.6L11 14.175L8.825 12L11 9.825L9.6 8.4L6 12L9.6 15.6ZM14.4 15.6L18 12L14.4 8.4L13 9.825L15.175 12L13 14.175L14.4 15.6ZM5 21C4.45 21 3.97917 20.8042 3.5875 20.4125C3.19583 20.0208 3 19.55 3 19V5C3 4.45 3.19583 3.97917 3.5875 3.5875C3.97917 3.19583 4.45 3 5 3H19C19.55 3 20.0208 3.19583 20.4125 3.5875C20.8042 3.97917 21 4.45 21 5V19C21 19.55 20.8042 20.0208 20.4125 20.4125C20.0208 20.8042 19.55 21 19 21H5ZM5 19H19V5H5V19Z"
      fill="currentColor"
    />
  </svg>
));

Payload.displayName = 'Payload';

export default Payload;
