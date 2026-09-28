// Auto-generated from third-party/typeform.svg
import React from 'react';

export interface TypeformProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Typeform = React.forwardRef<SVGSVGElement, TypeformProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M1 8.39361C1 6.01263 1.93807 4.77864 3.51908 4.77864C5.09984 4.77864 6.03817 6.01263 6.03817 8.39361V15.6064C6.03817 17.9874 5.10009 19.2214 3.51908 19.2214C1.93807 19.2214 1 17.9874 1 15.6064V8.39361ZM17.9696 4.77864H12.7629C8.09185 4.77864 7.72366 6.79586 7.72366 9.48549L7.71753 14.5075C7.71753 17.3117 8.06939 19.2214 12.781 19.2214H17.9696C22.6557 19.2214 23 17.2111 23 14.5215V9.49249C23 6.79586 22.6407 4.77864 17.9696 4.77864Z" fill="black"/>
    </svg>
  )
);

Typeform.displayName = 'Typeform';

export default Typeform;
