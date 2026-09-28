// Auto-generated from navigation/layers.svg
import React from 'react';

export interface LayersProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Layers = React.forwardRef<SVGSVGElement, LayersProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 16.465L19.36 10.735L21 9.465L12 2.465L3 9.465L4.63 10.735L12 16.465ZM11.99 19.005L4.62 13.275L3 14.535L12 21.535L21 14.535L19.37 13.265L11.99 19.005ZM17.74 9.465L12 4.995L6.26 9.465L12 13.935L17.74 9.465Z" fill="currentColor"/>
    </svg>
  )
);

Layers.displayName = 'Layers';

export default Layers;
