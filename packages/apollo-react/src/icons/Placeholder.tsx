// Auto-generated from object/placeholder.svg
import React from 'react';

export interface PlaceholderProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Placeholder = React.forwardRef<SVGSVGElement, PlaceholderProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M20.0066 5.66624L13.316 2.26639C12.6127 1.9112 11.7863 1.9112 11.083 2.26639L4.39051 5.66718C3.53974 6.09683 3.00038 6.98079 2.99988 7.9484L2.99988 16.0405C2.99326 17.004 3.52803 17.8933 4.37984 18.3295L11.0728 21.7305C11.7793 22.0898 12.6113 22.0898 13.3181 21.7304L20.0085 18.3307C20.8593 17.901 21.3986 17.0171 21.3991 16.0495V7.94885C21.3986 6.98079 20.8593 6.09683 20.0066 5.66624ZM12.1999 10.1944L5.71089 6.89705L11.8297 3.78778C12.062 3.67045 12.3371 3.67032 12.5714 3.78833L18.6889 6.89698L12.1999 10.1944ZM13.036 11.6701L19.727 8.27009V16.049C19.7268 16.3711 19.547 16.6657 19.2628 16.8093L13.036 19.9734V11.6701ZM11.3634 11.6699L4.67303 8.27024L4.67301 16.0464C4.6708 16.3695 4.84906 16.666 5.13069 16.8102L11.3634 19.9774V11.6699Z" fill="currentColor"/>
    </svg>
  )
);

Placeholder.displayName = 'Placeholder';

export default Placeholder;
