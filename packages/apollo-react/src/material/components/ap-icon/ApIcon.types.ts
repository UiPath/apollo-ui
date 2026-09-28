export interface ApIconProps {
  /**
   * The name of the icon.
   * - For Material Icons: use the icon name (e.g., 'home', 'settings')
   * - For legacy icons: use snake_case name (e.g., 'autopilot_color')
   */
  name: string;
  /**
   * Size of the icon. Defaults to token.Icon.IconM if not specified.
   */
  size?: string;
  /**
   * Color of the icon. Defaults to 'currentColor' if not specified.
   */
  color?: string;
  /**
   * Icon variant:
   * - 'normal': Material Icons filled variant
   * - 'outlined': Material Icons outlined variant
   * - 'custom': Legacy custom SVG icons
   * @default 'normal'
   */
  variant?: 'normal' | 'outlined' | 'custom';
  /**
   * Test ID for testing purposes
   * @default 'ap-icon'
   */
  'data-testid'?: string;
  /**
   * Style of the icon.
   */
  style?: React.CSSProperties;
}
