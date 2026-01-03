// Auto-generated from ui-agents-icons/agent-trace/agent-trace-output-correction.svg
import React from 'react';

export interface AgentTraceOutputCorrectionProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AgentTraceOutputCorrection = React.forwardRef<
  SVGSVGElement,
  AgentTraceOutputCorrectionProps
>(({ size, ...props }, ref) => (
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
      d="M4.78578 19.7767C4.29147 19.7767 3.86831 19.6007 3.5163 19.2487C3.16429 18.8967 2.98828 18.4735 2.98828 17.9792V13.785H4.78578V17.9792H8.97996V19.7767H4.78578ZM2.98828 8.99168V4.7975C2.98828 4.30319 3.16429 3.88003 3.5163 3.52802C3.86831 3.17601 4.29147 3 4.78578 3H8.97996V4.7975H4.78578V8.99168H2.98828ZM17.9675 8.99168V4.7975H13.7733V3H17.9675C18.4618 3 18.885 3.17601 19.237 3.52802C19.589 3.88003 19.765 4.30319 19.765 4.7975V8.99168H17.9675Z"
      fill="currentColor"
    />
    <path
      d="M16.1442 19.7019L17.4174 21.0001L21.0124 17.4051L17.3675 13.7851L16.1442 15.0334L17.5922 16.4814H13.7725V18.2789H17.5672L16.1442 19.7019Z"
      fill="#0067DF"
    />
  </svg>
));

AgentTraceOutputCorrection.displayName = 'AgentTraceOutputCorrection';

export default AgentTraceOutputCorrection;
