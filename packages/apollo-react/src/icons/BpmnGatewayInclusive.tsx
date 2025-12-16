// Auto-generated from ui-bpmn-canvas/bpmn-gateway/bpmn-gateway-inclusive.svg
import React from 'react';

export interface BpmnGatewayInclusiveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BpmnGatewayInclusive = React.forwardRef<SVGSVGElement, BpmnGatewayInclusiveProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M22.6066 11.2929C22.9971 11.6834 22.997 12.3166 22.6066 12.7071L12.7071 22.6066C12.3166 22.9971 11.6834 22.9971 11.2929 22.6066L1.39342 12.7071C1.00301 12.3166 1.00294 11.6834 1.39342 11.2929L11.2929 1.3934C11.6834 1.00302 12.3166 1.00303 12.7071 1.3934L22.6066 11.2929ZM12.3536 3.16116C12.1583 2.96594 11.8417 2.96601 11.6465 3.16116L3.16119 11.6464C2.96593 11.8417 2.96593 12.1583 3.16119 12.3536L11.6465 20.8388C11.8417 21.0341 12.1583 21.0341 12.3536 20.8388L20.8389 12.3536C21.034 12.1583 21.0341 11.8417 20.8389 11.6464L12.3536 3.16116Z" fill="currentColor"/>
<path d="M17 12C17 14.7614 14.7614 17 12 17C9.2386 17 7.00002 14.7614 7.00002 12C7.00002 9.23857 9.2386 7 12 7C14.7614 7 17 9.23857 17 12ZM8.50002 12C8.50002 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.50002 10.067 8.50002 12Z" fill="currentColor"/>
    </svg>
  )
);

BpmnGatewayInclusive.displayName = 'BpmnGatewayInclusive';

export default BpmnGatewayInclusive;
