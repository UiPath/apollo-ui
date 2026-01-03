// Auto-generated from ui-bpmn-canvas/bpmn-toolbar/bpmn-toolbar-connect.svg
import React from 'react';

export interface BpmnToolbarConnectProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnToolbarConnect = React.forwardRef<SVGSVGElement, BpmnToolbarConnectProps>(
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
      <path
        d="M11.5002 4.99942C11.5005 4.5855 11.8361 4.24955 12.2501 4.2495L19.0001 4.25019C19.4143 4.25019 19.75 4.5859 19.75 5.00011L19.7507 11.7501C19.7506 12.1641 19.4147 12.4997 19.0008 12.5C18.5865 12.5 18.2501 12.1636 18.2501 11.7494V6.81069L5.53051 19.5303L4.46985 18.4697L17.1895 5.75003H12.2508C11.8366 5.75003 11.5002 5.41364 11.5002 4.99942Z"
        fill="currentColor"
      />
    </svg>
  )
);

BpmnToolbarConnect.displayName = 'BpmnToolbarConnect';

export default BpmnToolbarConnect;
