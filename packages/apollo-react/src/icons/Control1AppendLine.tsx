// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-append-line.svg
import React from 'react';

export interface Control1AppendLineProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 25
   */
  size?: string | number;
}

export const Control1AppendLine = React.forwardRef<SVGSVGElement, Control1AppendLineProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 25}
      height={size ?? 25}
    >
      <path
        d="M6.27735 2.23535H14.2774L20.2774 8.23535V13.2354H18.2774V9.23535H13.2774V4.23535H6.27735L6.27742 12.2354H4.2793L4.28735 4.23535C4.28735 3.13535 5.17735 2.23535 6.27735 2.23535Z"
        fill="currentColor"
      />
      <path d="M4.27734 14.2354H13.2773V16.2354H4.27734V14.2354Z" fill="currentColor" />
      <path d="M4.27734 18.2354H13.2773V20.2354H4.27734V18.2354Z" fill="currentColor" />
      <path
        d="M20.2773 15.2354H18.2773V18.2354H15.2773V20.2354H18.2773V23.2354H20.2773V20.2354H23.2773V18.2354H20.2773V15.2354Z"
        fill="#038108"
      />
    </svg>
  )
);

Control1AppendLine.displayName = 'Control1AppendLine';

export default Control1AppendLine;
