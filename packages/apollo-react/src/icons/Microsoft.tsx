// Auto-generated from third-party/microsoft.svg
import React from 'react';

export interface MicrosoftProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Microsoft = React.forwardRef<SVGSVGElement, MicrosoftProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <rect x="12.9092" y="12.9091" width="9.09091" height="9.09091" fill="#FEBA08"/>
<rect x="2" y="12.9091" width="9.09091" height="9.09091" fill="#05A6F0"/>
<rect x="12.9092" y="2" width="9.09091" height="9.09091" fill="#80BC06"/>
<rect x="2" y="2" width="9.09091" height="9.09091" fill="#F25325"/>
    </svg>
  )
);

Microsoft.displayName = 'Microsoft';

export default Microsoft;
