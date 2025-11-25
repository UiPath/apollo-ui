import React, { Suspense } from 'react';
import type { IconName } from '@uipath/apollo-core/icons';

export interface ApIconProps {
  /**
   * The name of the icon from apollo-core/icons
   */
  name: IconName;
  /**
   * Size of the icon in pixels
   * @default 24
   */
  size?: number | string;
  /**
   * Color of the icon (CSS color value)
   * @default 'currentColor'
   */
  color?: string;
  /**
   * CSS class name for custom styling
   */
  className?: string;
  /**
   * Inline styles
   */
  style?: React.CSSProperties;
  /**
   * Accessible label for the icon
   */
  ariaLabel?: string;
  /**
   * Whether the icon is decorative (hides from screen readers)
   * @default false
   */
  decorative?: boolean;
  /**
   * Title for the icon (shows on hover)
   */
  title?: string;
  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  /**
   * Test ID for testing
   */
  testId?: string;
  /**
   * Fallback to show while icon is loading
   */
  fallback?: React.ReactNode;
}

// Helper: Convert PascalCase icon name to kebab-case filename
const iconNameToPath = (name: string): string => {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
};

interface IconRendererProps {
  name: IconName;
  size: number | string;
  color: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  decorative: boolean;
  title?: string;
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  testId?: string;
}

const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  size,
  color,
  className,
  style,
  ariaLabel,
  decorative,
  title,
  onClick,
  testId,
}) => {
  // Parse size to ensure it's a valid CSS value
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  // Combine styles
  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeValue,
    height: sizeValue,
    flexShrink: 0,
    color,
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };

  // Dynamically import the SVG content
  const [svgContent, setSvgContent] = React.useState<string | null>(null);
  const iconPath = iconNameToPath(name);

  React.useEffect(() => {
    import(`@uipath/apollo-core/icons/svg/${iconPath}.svg`)
      .then((module) => {
        const svg = module.default;
        // Process SVG content to inject color and size
        const processedSvg = svg.replace(
          /<svg/,
          `<svg fill="${color}" width="${sizeValue}" height="${sizeValue}"`
        );
        setSvgContent(processedSvg);
      })
      .catch((error) => {
        console.error(`Failed to load icon "${name}"`, error);
        setSvgContent(null);
      });
  }, [name, iconPath, color, sizeValue]);

  if (!svgContent) {
    return (
      <span
        className={className}
        style={combinedStyle}
        data-testid={testId}
        title={title}
      />
    );
  }

  return (
    <span
      className={className}
      style={combinedStyle}
      onClick={onClick}
      role={onClick ? 'button' : decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : ariaLabel || name}
      aria-hidden={decorative}
      title={title}
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

/**
 * ApIcon - Icon component for Apollo Design System
 *
 * Displays SVG icons from the apollo-core icon library with customizable size and color.
 * All icon names are fully typed for autocomplete support.
 * Icons are loaded on-demand using dynamic imports for optimal performance.
 *
 * @example
 * ```tsx
 * <ApIcon name="AlertError" size={24} color="red" />
 * <ApIcon name="ArrowLeft" size={32} />
 * <ApIcon name="Academy" color="var(--color-primary-500)" />
 * ```
 */
export const ApIcon = React.forwardRef<HTMLSpanElement, ApIconProps>(
  (
    {
      name,
      size = 24,
      color = 'currentColor',
      className,
      style,
      ariaLabel,
      decorative = false,
      title,
      onClick,
      testId,
      fallback = null,
    },
    ref
  ) => {
    return (
      <span ref={ref}>
        <Suspense fallback={fallback}>
          <IconRenderer
            name={name}
            size={size}
            color={color}
            className={className}
            style={style}
            ariaLabel={ariaLabel}
            decorative={decorative}
            title={title}
            onClick={onClick}
            testId={testId}
          />
        </Suspense>
      </span>
    );
  }
);

ApIcon.displayName = 'ApIcon';
