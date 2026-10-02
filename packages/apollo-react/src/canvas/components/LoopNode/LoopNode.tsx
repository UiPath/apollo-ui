import { cn } from '@uipath/apollo-wind';
import { memo, useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { DEFAULT_CONTAINER_WIDTH } from '../../utils/container';
import { CanvasIcon } from '../../utils/icon-registry';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { ContainerBadge } from '../ContainerNode/ContainerBadge';
import { ContainerNode } from '../ContainerNode/ContainerNode';
import type { ContainerNodeDefaults } from '../ContainerNode/ContainerNode.types';
import type { LoopNodeProps } from './LoopNode.types';
import { LoopNodeExecutionCount } from './LoopNodeExecutionCount';

const DEFAULT_LOOP_ICON = 'repeat';

/** The Sequential / Parallel pill shown in a loop header. */
export function LoopModePill({ parallel, label }: { parallel: boolean; label?: string }) {
  const { _ } = useSafeLingui();
  const resolvedLabel =
    label ??
    (parallel
      ? _({ id: 'loop-node.mode.parallel', message: 'Parallel' })
      : _({ id: 'loop-node.mode.sequential', message: 'Sequential' }));

  return (
    <ContainerBadge
      icon={
        <span className={cn('flex shrink-0', parallel && 'rotate-90')} aria-hidden>
          <CanvasIcon icon="text-align-justify" size={12} />
        </span>
      }
    >
      {resolvedLabel}
    </ContainerBadge>
  );
}

function LoopNodeComponent({ iterationPillState, defaults, ...props }: LoopNodeProps) {
  const { _ } = useSafeLingui();
  const isParallel = props.data?.parallel === true;
  const nodeWidth = props.width || DEFAULT_CONTAINER_WIDTH;
  const counterSize = nodeWidth >= 400 ? 'full' : nodeWidth >= 260 ? 'compact' : 'minimal';

  const loopDefaults = useMemo<ContainerNodeDefaults>(
    () => ({
      kind: 'loop',
      title: _({ id: 'loop-node.title', message: 'Loop' }),
      icon: DEFAULT_LOOP_ICON,
      headerBadges: <LoopModePill parallel={isParallel} />,
      headerEnd: iterationPillState ? (
        <LoopNodeExecutionCount state={iterationPillState} size={counterSize} />
      ) : undefined,
      emptyStateLabel: _({ id: 'loop-node.add-node', message: 'Add node to loop' }),
      ...defaults,
    }),
    [_, counterSize, defaults, isParallel, iterationPillState]
  );

  return <ContainerNode {...props} defaults={loopDefaults} />;
}

/** A `ContainerNode` preset with the loop title, icon, mode pill and iteration counter. */
export const LoopNode = memo(LoopNodeComponent, areNodePropsEqualIgnoringPosition);
