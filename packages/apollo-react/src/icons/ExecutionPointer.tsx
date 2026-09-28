// Auto-generated from studio-icons/execution-pointer.svg
import React from 'react';

export interface ExecutionPointerProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ExecutionPointer = React.forwardRef<SVGSVGElement, ExecutionPointerProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M11.3286 19.6358V15.2722H3.27246V8.72674H11.3286V4.36417L20.727 11.9995L11.3286 19.6358Z" fill="#0067DF"/>
    </svg>
  )
);

ExecutionPointer.displayName = 'ExecutionPointer';

export default ExecutionPointer;
