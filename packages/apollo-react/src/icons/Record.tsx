// Auto-generated from action/record.svg
import React from 'react';

export interface RecordProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Record = React.forwardRef<SVGSVGElement, RecordProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M9 4C4.58 4 1 7.58 1 12C1 16.42 4.58 20 9 20C13.42 20 17 16.42 17 12C17 7.58 13.42 4 9 4ZM9 18C5.69 18 3 15.31 3 12C3 8.69 5.69 6 9 6C12.31 6 15 8.69 15 12C15 15.31 12.31 18 9 18ZM17 6.35V4.26C20.45 5.15 23 8.27 23 12C23 15.73 20.45 18.85 17 19.74V17.65C19.33 16.83 21 14.61 21 12C21 9.39 19.33 7.17 17 6.35Z" fill="currentColor"/>
    </svg>
  )
);

Record.displayName = 'Record';

export default Record;
