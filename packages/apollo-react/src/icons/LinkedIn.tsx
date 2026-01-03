// Auto-generated from third-party/linkedin.svg
import React from 'react';

export interface LinkedInProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LinkedIn = React.forwardRef<SVGSVGElement, LinkedInProps>(
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
        d="M3.44444 23H20.5556C21.9056 23 23 21.9056 23 20.5556V3.44444C23 2.09441 21.9056 1 20.5556 1H3.44444C2.09441 1 1 2.09441 1 3.44444V20.5556C1 21.9056 2.09441 23 3.44444 23Z"
        fill="#007EBB"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.9446 19.9444H16.6799V14.384C16.6799 12.8594 16.1006 12.0075 14.8939 12.0075C13.5812 12.0075 12.8954 12.8941 12.8954 14.384V19.9444H9.74918V9.35184H12.8954V10.7787C12.8954 10.7787 13.8414 9.02822 16.0892 9.02822C18.336 9.02822 19.9446 10.4002 19.9446 13.2379V19.9444ZM5.99574 7.96482C4.92407 7.96482 4.05566 7.0896 4.05566 6.01018C4.05566 4.93076 4.92407 4.05554 5.99574 4.05554C7.06741 4.05554 7.9353 4.93076 7.9353 6.01018C7.9353 7.0896 7.06741 7.96482 5.99574 7.96482ZM4.37117 19.9444H7.65187V9.35184H4.37117V19.9444Z"
        fill="white"
      />
    </svg>
  )
);

LinkedIn.displayName = 'LinkedIn';

export default LinkedIn;
