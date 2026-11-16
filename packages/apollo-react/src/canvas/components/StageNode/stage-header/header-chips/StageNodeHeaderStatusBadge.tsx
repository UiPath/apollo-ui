import { memo } from 'react';
import { CanvasTooltip } from '../../../CanvasTooltip';

const STATUS_BADGE_BASE_CLASS =
  'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-[10px] border px-2 text-xs font-normal';

interface StageNodeHeaderStatusBadgeInnerProps {
  label: string;
  tooltip?: React.ReactNode;
  className: string;
  hoverClassName: string;
  testId: string;
  onClick?: () => void;
}

/**
 * Status pill (e.g. "Optional", "Ends case"). Interactive when an `onClick` is supplied —
 * it then renders a focusable button with hover that navigates the consumer to the related control;
 * otherwise it renders a plain, non-interactive label.
 */
const StageNodeHeaderStatusBadgeInner = ({
  label,
  tooltip,
  className,
  hoverClassName,
  testId,
  onClick,
}: StageNodeHeaderStatusBadgeInnerProps) => {
  const badge = onClick ? (
    <button
      type="button"
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${STATUS_BADGE_BASE_CLASS} ${className} ${hoverClassName} cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      {label}
    </button>
  ) : (
    <span data-testid={testId} className={`${STATUS_BADGE_BASE_CLASS} ${className}`}>
      {label}
    </span>
  );

  if (tooltip) {
    return (
      <CanvasTooltip placement="bottom" content={tooltip}>
        {badge}
      </CanvasTooltip>
    );
  }
  return badge;
};

export const StageNodeHeaderStatusBadge = memo(StageNodeHeaderStatusBadgeInner);
