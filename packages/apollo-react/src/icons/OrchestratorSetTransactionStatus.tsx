// Auto-generated from studio-activities-icon-sets/activities-orchestrator/orchestrator-set-transaction-status.svg
import React from 'react';

export interface OrchestratorSetTransactionStatusProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const OrchestratorSetTransactionStatus = React.forwardRef<SVGSVGElement, OrchestratorSetTransactionStatusProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 25}>
      <path d="M18 23L18 18.99L15 18.99L19 15L23 18.99L20 18.99L20 23L18 23Z" fill="#1976D2"/>
<path d="M3 5L15.01 5V2L19 6L15.01 10L15.01 7L3 7V19C1.89543 19 1 18.1046 1 17V7C1 5.89543 1.89543 5 3 5Z" fill="currentColor"/>
<path d="M23 7C23 5.89543 22.1046 5 21 5V13H23V7Z" fill="currentColor"/>
<path d="M12 19V17H8.99L8.99 14L5 18L8.99 22V19H12Z" fill="currentColor"/>
    </svg>
  )
);

OrchestratorSetTransactionStatus.displayName = 'OrchestratorSetTransactionStatus';

export default OrchestratorSetTransactionStatus;
