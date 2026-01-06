// Auto-generated from studio-activities-icon-sets/classic-icons-configuration-panel/configuration-panel-dynamic-values.svg
import React from 'react';

export interface ConfigurationPanelDynamicValuesProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ConfigurationPanelDynamicValues = React.forwardRef<SVGSVGElement, ConfigurationPanelDynamicValuesProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_1337)">
<path d="M9.9752 21L11.0002 13.95H7.3502C7.16686 13.95 7.03353 13.8667 6.9502 13.7C6.86686 13.5333 6.86686 13.375 6.9502 13.225L13.0752 3H14.1002L13.0752 10.025H16.6752C16.8585 10.025 16.996 10.1083 17.0877 10.275C17.1794 10.4417 17.1835 10.6 17.1002 10.75L11.0002 21H9.9752Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_1337">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

ConfigurationPanelDynamicValues.displayName = 'ConfigurationPanelDynamicValues';

export default ConfigurationPanelDynamicValues;
