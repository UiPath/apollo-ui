// Auto-generated from third-party/apple-mail.svg
import React from 'react';

export interface AppleMailProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AppleMail = React.forwardRef<SVGSVGElement, AppleMailProps>(
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
        d="M1 6C1 3.23858 3.23858 1 6 1H18C20.7614 1 23 3.23858 23 6V18C23 20.7614 20.7614 23 18 23H6C3.23858 23 1 20.7614 1 18V6Z"
        fill="url(#paint0_linear_5291_9721)"
      />
      <path
        d="M19.3873 16.7349C19.1496 16.9012 18.8595 17 18.5455 17H5.45455C5.12966 17 4.83066 16.8941 4.58854 16.7173L8.85653 12.1065L9.87216 13.104C10.9135 14.1265 12.6016 14.1265 13.643 13.104L14.6667 12.0986L19.3873 16.7349Z"
        fill="white"
      />
      <path
        d="M19.4995 7.35156C19.8058 7.61346 20 7.99844 20 8.42857V15.5714C20 15.8799 19.8994 16.1648 19.7301 16.3983L15.0095 11.7619L19.4995 7.35156Z"
        fill="white"
      />
      <path
        d="M8.51326 11.7693L4.25142 16.3741C4.09288 16.1453 4 15.8691 4 15.5714V8.42857C4 8.12007 4.10012 7.8348 4.26941 7.60128L8.51326 11.7693Z"
        fill="white"
      />
      <path
        d="M18.5455 7C18.7315 7 18.9089 7.03517 19.0724 7.09766L13.3002 12.7673C12.4482 13.6039 11.067 13.6039 10.215 12.7673L4.61222 7.2646C4.84998 7.09833 5.14044 7 5.45455 7H18.5455Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear_5291_9721"
          x1="12.1352"
          y1="1"
          x2="12"
          y2="23"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1D70F2" />
          <stop offset="1" stopColor="#1AC8FC" />
        </linearGradient>
      </defs>
    </svg>
  )
);

AppleMail.displayName = 'AppleMail';

export default AppleMail;
