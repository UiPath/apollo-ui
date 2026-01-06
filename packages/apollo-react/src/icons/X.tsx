// Auto-generated from third-party/x.svg
import React from 'react';

export interface XProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const X = React.forwardRef<SVGSVGElement, XProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M14.093 10.3155L22.283 1H20.3422L13.2308 9.08852L7.55101 1H1L9.58902 13.2313L1 23H2.94088L10.4507 14.4583L16.449 23H23L14.0925 10.3155H14.093ZM11.4347 13.339L10.5644 12.1211L3.6402 2.42965H6.62127L12.2092 10.2509L13.0795 11.4689L20.3431 21.6354H17.3621L11.4347 13.3395V13.339Z" fill="black"/>
    </svg>
  )
);

X.displayName = 'X';

export default X;
