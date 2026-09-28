// Auto-generated from product-logo/insights.svg
import React from 'react';

export interface InsightsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Insights = React.forwardRef<SVGSVGElement, InsightsProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.22223 19.7778V2H2V22H22V19.7778H4.22223ZM20.042 8.93078L15.439 14.1092L11.5027 10.7353L7.23029 15.0077L5.65894 13.4364L11.3865 7.70883L15.2281 11.0016L18.4679 7.35672L16.4446 5.33335H22.0001V10.8889L20.042 8.93078Z" fill="currentColor"/>
    </svg>
  )
);

Insights.displayName = 'Insights';

export default Insights;
