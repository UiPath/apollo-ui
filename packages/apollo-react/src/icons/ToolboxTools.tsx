// Auto-generated from object/toolbox-tools.svg
import React from 'react';

export interface ToolboxToolsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ToolboxTools = React.forwardRef<SVGSVGElement, ToolboxToolsProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M7 6V5C7 4.45 7.19583 3.97917 7.5875 3.5875C7.97917 3.19583 8.45 3 9 3H15C15.55 3 16.0208 3.19583 16.4125 3.5875C16.8042 3.97917 17 4.45 17 5V6H17.7C18.1 6 18.4625 6.1125 18.7875 6.3375C19.1125 6.5625 19.35 6.85 19.5 7.2L21.85 12.6C21.9 12.7333 21.9375 12.8667 21.9625 13C21.9875 13.1333 22 13.2667 22 13.4V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V13.4C2 13.2667 2.0125 13.1333 2.0375 13C2.0625 12.8667 2.1 12.7333 2.15 12.6L4.5 7.2C4.65 6.85 4.8875 6.5625 5.2125 6.3375C5.5375 6.1125 5.9 6 6.3 6H7ZM9 6H15V5H9V6ZM7 12V11H9V12H15V11H17V12H19.4L17.7 8H6.3L4.6 12H7ZM7 14H4V18H20V14H17V15H15V14H9V15H7V14Z" fill="currentColor"/>
    </svg>
  )
);

ToolboxTools.displayName = 'ToolboxTools';

export default ToolboxTools;
