// Auto-generated from object/properties.svg
import React from 'react';

export interface PropertiesProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Properties = React.forwardRef<SVGSVGElement, PropertiesProps>(
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
        d="M17.15 20.7L11.1 14.6C10.7667 14.7333 10.4292 14.8333 10.0875 14.9C9.74583 14.9667 9.38333 15 9 15C7.33333 15 5.91667 14.4167 4.75 13.25C3.58333 12.0833 3 10.6667 3 9C3 8.4 3.08333 7.82917 3.25 7.2875C3.41667 6.74583 3.65 6.23333 3.95 5.75L7.6 9.4L9.4 7.6L5.75 3.95C6.23333 3.65 6.74583 3.41667 7.2875 3.25C7.82917 3.08333 8.4 3 9 3C10.6667 3 12.0833 3.58333 13.25 4.75C14.4167 5.91667 15 7.33333 15 9C15 9.38333 14.9667 9.74583 14.9 10.0875C14.8333 10.4292 14.7333 10.7667 14.6 11.1L20.7 17.15C20.9 17.35 21 17.5917 21 17.875C21 18.1583 20.9 18.4 20.7 18.6L18.6 20.7C18.4 20.9 18.1583 21 17.875 21C17.5917 21 17.35 20.9 17.15 20.7ZM17.875 18.575L18.55 17.9L12.15 11.5C12.45 11.1667 12.6667 10.7792 12.8 10.3375C12.9333 9.89583 13 9.45 13 9C13 8 12.6792 7.12917 12.0375 6.3875C11.3958 5.64583 10.6 5.2 9.65 5.05L11.5 6.9C11.7 7.1 11.8 7.33333 11.8 7.6C11.8 7.86667 11.7 8.1 11.5 8.3L8.3 11.5C8.1 11.7 7.86667 11.8 7.6 11.8C7.33333 11.8 7.1 11.7 6.9 11.5L5.05 9.65C5.2 10.6 5.64583 11.3958 6.3875 12.0375C7.12917 12.6792 8 13 9 13C9.43333 13 9.86667 12.9333 10.3 12.8C10.7333 12.6667 11.125 12.4583 11.475 12.175L17.875 18.575Z"
        fill="currentColor"
      />
    </svg>
  )
);

Properties.displayName = 'Properties';

export default Properties;
