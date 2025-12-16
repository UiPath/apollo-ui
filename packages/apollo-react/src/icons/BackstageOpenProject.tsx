// Auto-generated from studio-activities-icon-sets/backstage/backstage-open-project.svg
import React from 'react';

export interface BackstageOpenProjectProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BackstageOpenProject = React.forwardRef<SVGSVGElement, BackstageOpenProjectProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M10 4L12 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18L2.00977 6C2.00977 4.9 2.9 4 4 4H10ZM4 8V18H20V8H4Z" fill="currentColor"/>
    </svg>
  )
);

BackstageOpenProject.displayName = 'BackstageOpenProject';

export default BackstageOpenProject;
