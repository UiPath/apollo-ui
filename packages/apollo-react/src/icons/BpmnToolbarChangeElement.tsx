// Auto-generated from ui-bpmn-canvas/bpmn-toolbar/bpmn-toolbar-change-element.svg
import React from 'react';

export interface BpmnToolbarChangeElementProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnToolbarChangeElement = React.forwardRef<SVGSVGElement, BpmnToolbarChangeElementProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M20.5 10C20.5 9.72386 20.2761 9.5 20 9.5H8C7.72386 9.5 7.5 9.72386 7.5 10V20C7.5 20.2761 7.72386 20.5 8 20.5H20C20.2761 20.5 20.5 20.2761 20.5 20V10ZM7.6 8C6.71634 8 6 8.7835 6 9.75V20.25C6 21.2165 6.71634 22 7.6 22H20.4C21.2837 22 22 21.2165 22 20.25V9.75C22 8.7835 21.2837 8 20.4 8H7.6Z" fill="currentColor"/>
<path d="M9.5 2C13.4741 2 16.7241 5.09105 16.9814 9H15.4775C15.2234 5.92031 12.6453 3.5 9.5 3.5C6.18629 3.5 3.5 6.18629 3.5 9.5C3.5 11.9212 4.93485 14.0059 7 14.9541V16.5713C4.08734 15.5415 2 12.7653 2 9.5C2 5.35786 5.35786 2 9.5 2Z" fill="currentColor"/>
    </svg>
  )
);

BpmnToolbarChangeElement.displayName = 'BpmnToolbarChangeElement';

export default BpmnToolbarChangeElement;
