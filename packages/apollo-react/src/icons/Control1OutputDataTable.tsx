// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-output-data-table.svg
import React from 'react';

export interface Control1OutputDataTableProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1OutputDataTable = React.forwardRef<
  SVGSVGElement,
  Control1OutputDataTableProps
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
    <g clipPath="url(#clip0_4117_1534)">
      <g clipPath="url(#clip1_4117_1534)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.27734 2.94141C3.72506 2.94141 3.27734 3.38912 3.27734 3.94141V18.9414C3.27734 19.4937 3.72506 19.9414 4.27734 19.9414H16.2773L14.2773 17.9414H11.2773V14.9414H17.2773V12.9414H11.2773V9.94141H16.2773H19.2773V10.9414H21.2773V3.94141C21.2773 3.38912 20.8296 2.94141 20.2773 2.94141H4.27734ZM5.27734 4.94141V7.94141H9.27734V4.94141H5.27734ZM5.27734 9.94141H9.27734V12.9414H5.27734V9.94141ZM5.27734 14.9414H9.27734V17.9414H5.27734V14.9414ZM11.2773 4.94141V7.94141H19.2773V4.94141H11.2773Z"
          fill="currentColor"
        />
        <path
          d="M21.2773 12.9414L21.2773 16.9514L24.2773 16.9514L20.2773 20.9414L16.2773 16.9514L19.2773 16.9514L19.2773 12.9414L21.2773 12.9414Z"
          fill="#1976D2"
        />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_4117_1534">
        <rect width="24" height="24" fill="var(--color-foreground)" />
      </clipPath>
      <clipPath id="clip1_4117_1534">
        <rect
          width="24"
          height="24"
          fill="var(--color-foreground)"
          transform="translate(0.277344 -0.0585938)"
        />
      </clipPath>
    </defs>
  </svg>
));

Control1OutputDataTable.displayName = 'Control1OutputDataTable';

export default Control1OutputDataTable;
