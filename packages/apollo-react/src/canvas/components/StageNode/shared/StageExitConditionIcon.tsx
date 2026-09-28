import { ExitConditionIcon } from '../../../icons';
import { CanvasTooltip } from '../../CanvasTooltip';

export const StageExitConditionIcon = ({
  dataTestId,
  small,
}: {
  dataTestId?: string;
  small?: boolean;
}) => {
  return (
    <CanvasTooltip content="Exit condition" placement="top">
      <span
        data-testid={dataTestId ?? `exit-condition-icon`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-icon-default)',
          flexShrink: 0,
          // Optically centre the diamond;
          transform: small ? 'translateX(1px)' : 'translateX(0.5px)',
        }}
      >
        <ExitConditionIcon w={small ? 16 : 20} h={small ? 16 : 20} />
      </span>
    </CanvasTooltip>
  );
};
