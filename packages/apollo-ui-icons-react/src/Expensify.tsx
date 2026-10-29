// Auto-generated from third-party/expensify.svg
import React from 'react';

export interface ExpensifyProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Expensify = React.forwardRef<SVGSVGElement, ExpensifyProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M8.47998 17.06H15.52V14.97H11.054V13.012H14.86V10.878H11.054V9.008H15.52V6.94H8.47998V17.06Z" fill="#0B1B34"/>
<path d="M20.7998 12C20.7998 14.112 20.0518 16.048 18.8198 17.566L20.3818 19.128C22.0098 17.214 22.9998 14.728 22.9998 12C22.9998 9.31599 22.0318 6.85199 20.4478 4.95999L18.8858 6.52199C20.0738 8.01799 20.7998 9.93199 20.7998 12Z" fill="#03D47C"/>
<path d="M17.566 18.82C16.048 20.052 14.112 20.8 12 20.8C9.93196 20.8 8.01796 20.074 6.52196 18.886L4.95996 20.448C6.87396 22.054 9.33796 23 12 23C14.728 23 17.214 22.01 19.128 20.382L17.566 18.82Z" fill="#0185FF"/>
<path d="M5.246 17.654C3.97 16.114 3.2 14.156 3.2 12C3.2 7.138 7.138 3.2 12 3.2C14.156 3.2 16.114 3.97 17.654 5.246L19.216 3.684C17.28 2.012 14.75 1 12 1C5.928 1 1 5.928 1 12C1 14.75 2.012 17.28 3.684 19.216L5.246 17.654Z" fill="#FED607"/>
    </svg>
  )
);

Expensify.displayName = 'Expensify';

export default Expensify;
