import { ChecklistIcon } from '../../../../icons';
import { CanvasTooltip } from '../../CanvasTooltip';

export const StageCompletionConditionIcon = ({
  dataTestId,
  small,
}: {
  dataTestId?: string;
  small?: boolean;
}) => {
  return (
    <CanvasTooltip content="Completion condition" placement="top">
      <span
        data-testid={dataTestId ?? `completion-condition-icon`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-icon-default)',
          flexShrink: 0,
          // Optically centre the icon;
          transform: small ? 'translateX(1px)' : 'translateX(0.5px)',
        }}
      >
        <ChecklistIcon size={small ? 16 : 20} />
      </span>
    </CanvasTooltip>
  );
};
