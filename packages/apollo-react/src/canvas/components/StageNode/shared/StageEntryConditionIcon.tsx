import { EntryConditionIcon } from '../../../icons';
import { CanvasTooltip } from '../../CanvasTooltip';

export const StageEntryConditionIcon = ({
  dataTestId,
  small,
}: {
  dataTestId?: string;
  small?: boolean;
}) => {
  return (
    <CanvasTooltip content="Entry condition" placement="top">
      <span
        data-testid={dataTestId ?? `entry-condition-icon`}
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
        <EntryConditionIcon
          w={small ? 13 : 20}
          h={small ? 15 : 20}
          tight={small ? true : undefined}
        />
      </span>
    </CanvasTooltip>
  );
};
