import { Button } from '@uipath/apollo-wind';
import { ChevronsUpDown } from 'lucide-react';
import type React from 'react';
import type { DiffFold, DiffLabels } from './decisionTextDiff';
import { FOLD_BUTTON_CLASS, FOLD_ROW_CLASS } from './sentenceStyles';

export interface DiffFoldRowProps {
  rowId: string;
  fold: DiffFold;
  position: number;
  setSize: number;
  onExpand: (firstRowId: string) => void;
  dataTestId: string;
  labels: Pick<DiffLabels, 'unchangedRules' | 'showRules'>;
}

/** A folded run of unchanged rules in compact mode, opened in place by its button. */
export const DiffFoldRow: React.FC<DiffFoldRowProps> = ({
  rowId,
  fold,
  position,
  setSize,
  onExpand,
  dataTestId,
  labels,
}) => (
  <li
    aria-posinset={position}
    aria-setsize={setSize}
    className={FOLD_ROW_CLASS}
    data-row-id={rowId}
    data-testid={`${dataTestId}-fold-${fold.firstRowId}`}
  >
    <Button
      variant="ghost"
      size="sm"
      className={FOLD_BUTTON_CLASS}
      title={labels.showRules(fold.from, fold.to)}
      onClick={() => onExpand(fold.firstRowId)}
    >
      <ChevronsUpDown aria-hidden />
      {labels.unchangedRules(fold.count)}
    </Button>
  </li>
);
