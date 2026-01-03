// Auto-generated from product-logo/process-mining.svg
import React from 'react';

export interface ProcessMiningProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ProcessMining = React.forwardRef<SVGSVGElement, ProcessMiningProps>(
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
        d="M4.66667 9.33333V2H19.3333V9.33333H4.66667ZM7.11111 4.44444H16.8889V6.88889H7.11111V4.44444Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.7778 10.5556V13H1V20.3333H23V13H13.2222V10.5556H10.7778ZM20.5556 15.4444H3.44444V17.8889H20.5556V15.4444Z"
        fill="currentColor"
      />
      <path d="M10.7778 21.5556V24H13.2222V21.5556H10.7778Z" fill="currentColor" />
    </svg>
  )
);

ProcessMining.displayName = 'ProcessMining';

export default ProcessMining;
