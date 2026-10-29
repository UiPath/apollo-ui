// Auto-generated from editor/text-decrease.svg
import React from 'react';

export interface TextDecreaseProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TextDecrease = React.forwardRef<SVGSVGElement, TextDecreaseProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M0.995117 19H3.41512L4.68512 15.42H10.3351L11.5951 19H14.0151L8.75512 5H6.25512L0.995117 19ZM5.41512 13.39L7.44512 7.6H7.56512L9.59512 13.39H5.41512ZM23.0051 11V13H15.0051V11H23.0051Z" fill="currentColor"/>
    </svg>
  )
);

TextDecrease.displayName = 'TextDecrease';

export default TextDecrease;
