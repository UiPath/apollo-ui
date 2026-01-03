// Auto-generated from product-logo/automation-store.svg
import React from 'react';

export interface AutomationStoreProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AutomationStore = React.forwardRef<SVGSVGElement, AutomationStoreProps>(
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.8803 1.76123L13.039 0L11.1978 1.76123L13.039 3.52246L14.8803 1.76123ZM24 5.67293L21.6155 9.09432V22.4191H3.38641V9.09704L1 5.67293L3.16679 4.29116L5.38437 7.47303H19.6156L21.8332 4.29116L24 5.67293ZM19.0113 9.96408H5.99056V19.9281H19.0113V9.96408ZM9.13301 2.491L10.9742 4.25223L9.13301 6.01345L7.29179 4.25223L9.13301 2.491ZM18.7868 4.25223L16.9456 2.491L15.1044 4.25223L16.9456 6.01345L18.7868 4.25223Z"
        fill="currentColor"
      />
    </svg>
  )
);

AutomationStore.displayName = 'AutomationStore';

export default AutomationStore;
