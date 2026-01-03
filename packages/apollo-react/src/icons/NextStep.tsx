// Auto-generated from studio-icons/next-step.svg
import React from 'react';

export interface NextStepProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const NextStep = React.forwardRef<SVGSVGElement, NextStepProps>(
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
        d="M5.83301 18L5.83301 6H7.83301L7.83301 18H5.83301ZM9.83301 18L19.833 12L9.83301 6V18Z"
        fill="currentColor"
      />
    </svg>
  )
);

NextStep.displayName = 'NextStep';

export default NextStep;
