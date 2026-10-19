import { ToggleGroup, ToggleGroupItem } from '@uipath/apollo-wind';
import { memo, type SyntheticEvent, useCallback } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';
import { useOptionalSequencedContainers } from '../SequentialCanvas/SequencedContainersContext';

type BodyView = 'flow' | 'sequence';

const stop = (event: SyntheticEvent) => event.stopPropagation();

/**
 * Flow / sequence switch for a container's body, shown in the header end slot.
 * Renders nothing outside a canvas that provides sequenced-container state, or
 * when that canvas cannot sequence this body. Distinct from the loop's
 * iteration-mode badge, which also reads "Sequential".
 */
export const ContainerBodyViewSwitch = memo(function ContainerBodyViewSwitch({
  containerId,
}: {
  containerId: string;
}) {
  const { _ } = useSafeLingui();
  const sequenced = useOptionalSequencedContainers();
  const value: BodyView = sequenced?.isSequenced(containerId) ? 'sequence' : 'flow';

  const onValueChange = useCallback(
    (next: string) => {
      // Radix emits '' when the active item is re-pressed; a segmented control is never empty.
      if (next === 'flow' || next === 'sequence')
        sequenced?.setSequenced(containerId, next === 'sequence');
    },
    [containerId, sequenced]
  );

  if (!sequenced || !sequenced.canSequence(containerId)) return null;

  return (
    <ToggleGroup
      type="single"
      size="xs"
      value={value}
      onValueChange={onValueChange}
      aria-label={_({ id: 'container.body-view.label', message: 'Body view' })}
      data-testid="container-body-view-switch"
      className="nodrag nopan"
      onMouseDown={stop}
      onPointerDown={stop}
      onClick={stop}
      onDoubleClick={stop}
    >
      <ToggleGroupItem
        value="flow"
        aria-label={_({ id: 'container.body-view.flow', message: 'Flow' })}
      >
        <CanvasIcon icon="git-branch" size={14} />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="sequence"
        aria-label={_({ id: 'container.body-view.sequence', message: 'Sequence' })}
      >
        <CanvasIcon icon="list" size={14} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
});
