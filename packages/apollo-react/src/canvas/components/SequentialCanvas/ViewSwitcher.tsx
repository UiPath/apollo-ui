import { ToggleGroup, ToggleGroupItem } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';
import type { CanvasView } from '../../utils/sequential/sequential.types';
import type { ViewSwitcherProps } from './SequentialCanvas.types';

/**
 * Segmented flow/sequential control (D11). It is a controlled component: the
 * host owns `value` and `onChange` (typically wired to useCanvasViewMode /
 * SequentialViewProvider).
 */
function ViewSwitcherComponent({ value, onChange }: ViewSwitcherProps) {
  const { _ } = useSafeLingui();

  const flowLabel = _({ id: 'sequential-canvas.view.flow', message: 'Flow' });
  const sequentialLabel = _({ id: 'sequential-canvas.view.sequential', message: 'Sequential' });

  return (
    <div className="inline-flex items-center gap-2" data-testid="sequential-view-switcher">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          // Radix emits '' when the active item is re-pressed; keep the current
          // view rather than clearing it (a segmented control is never empty).
          if (next === 'flow' || next === 'sequential') onChange(next as CanvasView);
        }}
        aria-label={_({ id: 'sequential-canvas.view.label', message: 'Canvas view' })}
      >
        <ToggleGroupItem value="flow" aria-label={flowLabel}>
          <CanvasIcon icon="git-branch" size={16} />
          <span className="ml-1">{flowLabel}</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="sequential" aria-label={sequentialLabel}>
          <CanvasIcon icon="list" size={16} />
          <span className="ml-1">{sequentialLabel}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export const ViewSwitcher = memo(ViewSwitcherComponent);
