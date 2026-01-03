// Auto-generated from object/data-type/type-duration.svg
import React from 'react';

export interface TypeDurationProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TypeDuration = React.forwardRef<SVGSVGElement, TypeDurationProps>(
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
        d="M9 1.505H15V3.505H9V1.505ZM11 14.505V8.505H13V14.505H11ZM19.03 7.885L20.45 6.465C20.02 5.955 19.55 5.475 19.04 5.055L17.62 6.47501C16.07 5.235 14.12 4.495 12 4.495C7.03 4.495 3 8.52501 3 13.495C3 18.465 7.02 22.495 12 22.495C16.98 22.495 21 18.465 21 13.495C21 11.385 20.26 9.43501 19.03 7.885ZM5 13.505C5 17.375 8.13 20.505 12 20.505C15.87 20.505 19 17.375 19 13.505C19 9.635 15.87 6.505 12 6.505C8.13 6.505 5 9.635 5 13.505Z"
        fill="currentColor"
      />
    </svg>
  )
);

TypeDuration.displayName = 'TypeDuration';

export default TypeDuration;
