// Auto-generated from ui-bpmn-canvas/bpmn-glyph/bpmn-glyph-event-timer.svg
import React from 'react';

export interface BpmnGlyphEventTimerProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGlyphEventTimer = React.forwardRef<SVGSVGElement, BpmnGlyphEventTimerProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M15.9867 2.66667C8.62669 2.66667 2.66669 8.64 2.66669 16C2.66669 23.36 8.62669 29.3333 15.9867 29.3333C23.36 29.3333 29.3334 23.36 29.3334 16C29.3334 8.64 23.36 2.66667 15.9867 2.66667ZM16 26.6667C10.1067 26.6667 5.33335 21.8933 5.33335 16C5.33335 10.1067 10.1067 5.33334 16 5.33334C21.8934 5.33334 26.6667 10.1067 26.6667 16C26.6667 21.8933 21.8934 26.6667 16 26.6667ZM14.6667 9.33334H16.6667V16.3333L22.6667 19.8933L21.6667 21.5333L14.6667 17.3333V9.33334Z" />
    </svg>
  )
);

BpmnGlyphEventTimer.displayName = 'BpmnGlyphEventTimer';

export default BpmnGlyphEventTimer;
