// Auto-generated from studio-activities-icon-sets/activity-activity-input-direction/activity-input-direction-input.svg
import React from 'react';

export interface ActivityInputDirectionInputProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ActivityInputDirectionInput = React.forwardRef<
  SVGSVGElement,
  ActivityInputDirectionInputProps
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
    <path
      d="M8 7L7.11875 7.88125L10.6062 11.375H3V12.625H10.6062L7.11875 16.1187L8 17L13 12L8 7Z"
      fill="currentColor"
    />
    <path
      d="M4.7959 4.01074C3.78723 4.11301 3 4.96435 3 6V7.2002H5V6H19V18H5V16.7998H3V18L3.01074 18.2041C3.1062 19.1457 3.85435 19.8938 4.7959 19.9893L5 20H19L19.2041 19.9893C20.2128 19.887 21 19.0357 21 18V6C21 4.89543 20.1046 4 19 4H5L4.7959 4.01074Z"
      fill="currentColor"
    />
  </svg>
));

ActivityInputDirectionInput.displayName = 'ActivityInputDirectionInput';

export default ActivityInputDirectionInput;
