// Auto-generated from action/subdirectory-arrow-left.svg
import React from 'react';

export interface SubdirectoryArrowLeftProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SubdirectoryArrowLeft = React.forwardRef<SVGSVGElement, SubdirectoryArrowLeftProps>(
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
        d="M10.5 8.5L11.92 9.92L8.33 13.5H17.5V3.5H19.5V15.5H8.33L11.92 19.08L10.5 20.5L4.5 14.5L10.5 8.5Z"
        fill="currentColor"
      />
    </svg>
  )
);

SubdirectoryArrowLeft.displayName = 'SubdirectoryArrowLeft';

export default SubdirectoryArrowLeft;
