// Auto-generated from studio-icons/application-card.svg
import React from 'react';

export interface ApplicationCardProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ApplicationCard = React.forwardRef<SVGSVGElement, ApplicationCardProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M21 6C21 4.9 20.11 4 19 4H5C3.89 4 3 4.9 3 6V18C3 19.1 3.89 20 5 20H19C20.11 20 21 19.1 21 18V6ZM19 18V8H5V18H19Z" fill="currentColor"/>
    </svg>
  )
);

ApplicationCard.displayName = 'ApplicationCard';

export default ApplicationCard;
