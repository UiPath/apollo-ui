// Auto-generated from third-party/quickbooks.svg
import React from 'react';

export interface QuickbooksProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Quickbooks = React.forwardRef<SVGSVGElement, QuickbooksProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M12.0002 23C18.0638 23 22.9793 18.0751 22.9793 12C22.9793 5.92487 18.0638 1 12.0002 1C5.93654 1 1.021 5.92487 1.021 12C1.021 18.0751 5.93654 23 12.0002 23Z" fill="#2CA01C"/>
<path fillRule="evenodd" clipRule="evenodd" d="M4.06982 11.9994C4.06982 14.3619 5.98142 16.2772 8.3395 16.2772H8.94945V14.6883H8.3395C6.85951 14.6883 5.6557 13.4822 5.6557 11.9994C5.6557 10.5168 6.85951 9.31049 8.3395 9.31049H9.8051V17.6216C9.8051 18.4992 10.5151 19.2105 11.391 19.2105V7.7216H8.3395C5.98142 7.7216 4.06982 9.63707 4.06982 11.9994ZM15.6614 7.72233H15.0514V9.31122H15.6614C17.1409 9.31122 18.3452 10.5176 18.3452 12.0001C18.3452 13.4827 17.1409 14.689 15.6614 14.689H14.1951V6.37789C14.1951 5.50033 13.4851 4.789 12.6092 4.789V16.2779H15.6614C18.0192 16.2779 19.9311 14.3627 19.9311 12.0001C19.9311 9.63756 18.0192 7.72233 15.6614 7.72233Z" fill="white"/>
    </svg>
  )
);

Quickbooks.displayName = 'Quickbooks';

export default Quickbooks;
