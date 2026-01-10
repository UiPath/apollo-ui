/**
 * Props for the CanvasToolbarToggleGroup component
 */
export interface CanvasToolbarToggleGroupProps {
  /**
   * Currently selected value
   */
  value: string;

  /**
   * Callback when value changes
   */
  onValueChange: (value: string) => void;

  /**
   * Children (CanvasToolbarToggleItem components)
   */
  children: React.ReactNode;

  /**
   * When true, all toggle items are disabled
   * Can be inherited from CanvasToolbar context
   * @default false
   */
  disabled?: boolean;

  /**
   * Toggle type - currently only 'single' supported
   * @default 'single'
   */
  type?: 'single';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the CanvasToolbarToggleItem component
 */
export interface CanvasToolbarToggleItemProps {
  /**
   * Value for this toggle item
   */
  value: string;

  /**
   * Content to display
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}
