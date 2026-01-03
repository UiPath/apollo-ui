// Auto-generated from object/data-type/type-string.svg
import React from 'react';

export interface TypeStringProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TypeString = React.forwardRef<SVGSVGElement, TypeStringProps>(
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.1176 4V6.28571H10.2353V20H7.88235V6.28571H2V4H16.1176ZM19.6471 6.28571V9.71429H22V12H19.6471V17.7143H22V20H19.6471C18.3476 20 17.2941 18.9767 17.2941 17.7143V12H14.9412V9.71429H17.2941V6.28571H19.6471Z"
        fill="currentColor"
      />
    </svg>
  )
);

TypeString.displayName = 'TypeString';

export default TypeString;
