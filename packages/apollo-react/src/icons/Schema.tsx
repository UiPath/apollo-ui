// Auto-generated from editor/schema.svg
import React from 'react';

export interface SchemaProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Schema = React.forwardRef<SVGSVGElement, SchemaProps>(({ size, ...props }, ref) => (
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
      d="M13.5 9V11H10.5V9H8V7H10.5V1H3.5V7H6V9H3.5V15H6V17H3.5V23H10.5V17H8V15H10.5V13H13.5V15H20.5V9H13.5ZM5.5 3H8.5V5H5.5V3ZM8.5 21H5.5V19H8.5V21ZM8.5 13H5.5V11H8.5V13ZM18.5 13H15.5V11H18.5V13Z"
      fill="currentColor"
    />
  </svg>
));

Schema.displayName = 'Schema';

export default Schema;
