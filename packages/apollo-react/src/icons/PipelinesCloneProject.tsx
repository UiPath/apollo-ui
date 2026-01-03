// Auto-generated from studio-activities-icon-sets/activities-pipelines/pipelines-clone-project.svg
import React from 'react';

export interface PipelinesCloneProjectProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const PipelinesCloneProject = React.forwardRef<SVGSVGElement, PipelinesCloneProjectProps>(
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
      <path d="M3 3H10V5H3V16H1V5C1 3.9 1.9 3 3 3Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 11V20C23 21.1 22.1 22 21 22H7C5.89 22 5 21.11 5 20L5.01 9C5.01 7.89 5.89 7 7 7H13L15 9H21C22.11 9 23 9.89 23 11ZM21 11H14.17L12.17 9H7V20H21V11Z"
        fill="currentColor"
      />
    </svg>
  )
);

PipelinesCloneProject.displayName = 'PipelinesCloneProject';

export default PipelinesCloneProject;
