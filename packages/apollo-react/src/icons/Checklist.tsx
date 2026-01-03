// Auto-generated from editor/checklist.svg
import React from 'react';

export interface ChecklistProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Checklist = React.forwardRef<SVGSVGElement, ChecklistProps>(
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
        d="M22 7.535H13V9.535H22V7.535ZM22 15.535H13V17.535H22V15.535ZM5.54 11.535L2 7.995L3.41 6.585L5.53 8.705L9.77 4.465L11.18 5.875L5.54 11.535ZM5.54 19.535L2 15.995L3.41 14.585L5.53 16.705L9.77 12.465L11.18 13.875L5.54 19.535Z"
        fill="currentColor"
      />
    </svg>
  )
);

Checklist.displayName = 'Checklist';

export default Checklist;
