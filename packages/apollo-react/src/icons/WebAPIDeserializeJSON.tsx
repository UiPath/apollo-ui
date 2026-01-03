// Auto-generated from studio-activities-icon-sets/activities-web-api/web-api-deserialize-json.svg
import React from 'react';

export interface WebAPIDeserializeJSONProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const WebAPIDeserializeJSON = React.forwardRef<SVGSVGElement, WebAPIDeserializeJSONProps>(
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
      <g clipPath="url(#clip0_4117_1649)">
        <path
          d="M7 5H6C5.44772 5 5 5.44772 5 6V10C5 11.1046 4.10457 12 3 12L3.14941 12.0059C4.18419 12.0823 5 12.9457 5 14V18C5 18.5523 5.44772 19 6 19H7V21H5C3.89543 21 3 20.1046 3 19V13H2C1.44772 13 1 12.5523 1 12C1 11.4477 1.44772 11 2 11H3V5L3.00586 4.85059C3.08229 3.81581 3.9457 3 5 3H7V5Z"
          fill="currentColor"
        />
        <path
          d="M19 3C20.0543 3 20.9177 3.81581 20.9941 4.85059L21 5V11H22C22.5523 11 23 11.4477 23 12C23 12.5523 22.5523 13 22 13H21V19C21 20.1046 20.1046 21 19 21H17V19H18C18.5523 19 19 18.5523 19 18V14C19 12.9457 19.8158 12.0823 20.8506 12.0059L21 12C19.8954 12 19 11.1046 19 10V6C19 5.44772 18.5523 5 18 5H17V3H19Z"
          fill="currentColor"
        />
        <path
          d="M12 13C12.8284 13 13.5 13.6716 13.5 14.5C13.5 15.3284 12.8284 16 12 16C11.1716 16 10.5 15.3284 10.5 14.5C10.5 13.6716 11.1716 13 12 13Z"
          fill="currentColor"
        />
        <path
          d="M12 7C12.8284 7 13.5 7.67157 13.5 8.5C13.5 9.32843 12.8284 10 12 10C11.1716 10 10.5 9.32843 10.5 8.5C10.5 7.67157 11.1716 7 12 7Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1649">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

WebAPIDeserializeJSON.displayName = 'WebAPIDeserializeJSON';

export default WebAPIDeserializeJSON;
