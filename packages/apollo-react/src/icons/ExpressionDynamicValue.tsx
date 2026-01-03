// Auto-generated from object/expression-dynamic-value.svg
import React from 'react';

export interface ExpressionDynamicValueProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ExpressionDynamicValue = React.forwardRef<SVGSVGElement, ExpressionDynamicValueProps>(
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
      <path d="M7 2V13H10V22L17 10H13L16 2H7Z" fill="currentColor" />
    </svg>
  )
);

ExpressionDynamicValue.displayName = 'ExpressionDynamicValue';

export default ExpressionDynamicValue;
