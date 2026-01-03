// Auto-generated from studio-icons/advance-stream.svg
import React from 'react';

export interface AdvanceStreamProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AdvanceStream = React.forwardRef<SVGSVGElement, AdvanceStreamProps>(
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
      <path d="M15 18L19.01 18L19.01 15L23 19L19.01 23L19.01 20L15 20L15 18Z" fill="#1976D2" />
      <path
        d="M8 16.6699C9.51332 17.7305 11.288 18.1319 13 17.877V19.917C11.3002 20.1132 9.55358 19.8079 8 19C6.74001 19.65 5.36999 20 4 20H2V18H4C5.39 18 6.78 17.5299 8 16.6699ZM16 10.6699C17.22 11.5299 18.61 12 20 12H22V14H20C18.62 14 17.26 13.65 16 13C13.5 14.3 10.5 14.3 8 13C6.74001 13.65 5.36999 14 4 14H2V12H4C5.39 12 6.78 11.5299 8 10.6699C10.44 12.3799 13.56 12.3799 16 10.6699ZM16 4.66992C17.22 5.52992 18.61 6 20 6H22V8H20C18.62 8 17.26 7.64999 16 7C13.5 8.29998 10.5 8.29998 8 7C6.74001 7.64999 5.36999 8 4 8H2V6H4C5.39 6 6.78 5.52992 8 4.66992C10.44 6.37992 13.56 6.37992 16 4.66992Z"
        fill="currentColor"
      />
    </svg>
  )
);

AdvanceStream.displayName = 'AdvanceStream';

export default AdvanceStream;
