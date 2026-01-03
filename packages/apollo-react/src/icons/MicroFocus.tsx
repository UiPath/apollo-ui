// Auto-generated from third-party/micro-focus.svg
import React from 'react';

export interface MicroFocusProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const MicroFocus = React.forwardRef<SVGSVGElement, MicroFocusProps>(
  ({ size, ...props }, ref) => (
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
        d="M20.9996 17.5044V3H6.49512V6.49557H3V21H17.5044V17.5044H20.9996ZM17.5039 17.5043H6.49567V6.49567H17.5039V17.5043Z"
        fill="#0075F3"
      />
    </svg>
  )
);

MicroFocus.displayName = 'MicroFocus';

export default MicroFocus;
