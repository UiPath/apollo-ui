// Auto-generated from object/attachment.svg
import React from 'react';

export interface AttachmentProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Attachment = React.forwardRef<SVGSVGElement, AttachmentProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.50002 6.40002C3.4048 6.40002 0.900024 8.9048 0.900024 12C0.900024 15.0953 3.4048 17.6 6.50002 17.6H18.1V15.9H6.50002C4.34525 15.9 2.60002 14.1548 2.60002 12C2.60002 9.84525 4.34525 8.10002 6.50002 8.10002H19C20.3248 8.10002 21.4 9.17525 21.4 10.5C21.4 11.8248 20.3248 12.9 19 12.9H8.50002C8.00525 12.9 7.60002 12.4948 7.60002 12C7.60002 11.5053 8.00525 11.1 8.50002 11.1H18.1V9.40002H8.50002C7.0648 9.40002 5.90002 10.5648 5.90002 12C5.90002 13.4353 7.0648 14.6 8.50002 14.6H19C21.2653 14.6 23.1 12.7653 23.1 10.5C23.1 8.2348 21.2653 6.40002 19 6.40002H6.50002Z" fill="currentColor"/>
    </svg>
  )
);

Attachment.displayName = 'Attachment';

export default Attachment;
