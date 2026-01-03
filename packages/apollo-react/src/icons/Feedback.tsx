// Auto-generated from action/feedback.svg
import React from 'react';

export interface FeedbackProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Feedback = React.forwardRef<SVGSVGElement, FeedbackProps>(
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
        d="M4 2H20C21.1 2 22 2.9 22 4V16C22 17.1 21.1 18 20 18H6L2 22L2.01 4C2.01 2.9 2.9 2 4 2ZM5.17 16H20V4H4V17.17L4.58 16.59L5.17 16ZM10.5 14H18V12H12.5L10.5 14ZM14.36 7.42C14.56 7.62 14.56 7.93 14.36 8.13L8.47 14H6V11.53L11.88 5.65C12.08 5.45 12.39 5.45 12.59 5.65L14.36 7.42Z"
        fill="currentColor"
      />
    </svg>
  )
);

Feedback.displayName = 'Feedback';

export default Feedback;
