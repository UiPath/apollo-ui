// Auto-generated from studio-activities-icon-sets/activities-ui-automation/ui-automation-take-screenshot.svg
import React from 'react';

export interface UIAutomationTakeScreenshotProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UIAutomationTakeScreenshot = React.forwardRef<
  SVGSVGElement,
  UIAutomationTakeScreenshotProps
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
    <g clipPath="url(#clip0_4117_2302)">
      <path
        d="M14.12 5L15.95 7H20V19H4V7H8.05L9.88 5H14.12ZM15 3H9L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3ZM12 10C13.65 10 15 11.35 15 13C15 14.65 13.65 16 12 16C10.35 16 9 14.65 9 13C9 11.35 10.35 10 12 10ZM12 8C9.24 8 7 10.24 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 10.24 14.76 8 12 8Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_4117_2302">
        <rect width="24" height="24" fill="var(--color-foreground)" />
      </clipPath>
    </defs>
  </svg>
));

UIAutomationTakeScreenshot.displayName = 'UIAutomationTakeScreenshot';

export default UIAutomationTakeScreenshot;
