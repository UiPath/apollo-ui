import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@uipath/apollo-wind';
import type React from 'react';
import { useId, useState } from 'react';
import type { DecisionGraphActionLabels } from './decisionGraphActionTypes';
import type { DecisionGraphDecisionNode } from './decisionGraphTypes';

interface DialogBase {
  labels: DecisionGraphActionLabels;
  /** The host's refusal of the last try, worded, or null. */
  refusal: string | null;
  onClose: () => void;
  /** Where focus goes once the dialog is gone. */
  onCloseAutoFocus: (event: Event) => void;
  dataTestId: string;
}

const DIALOG_LIST_CLASS = 'max-h-[40vh] overflow-y-auto';

const Refusal = ({ refusal, id }: { refusal: string | null; id: string }) =>
  refusal === null ? null : (
    <p id={id} role="alert" className="m-0 text-sm text-destructive">
      {refusal}
    </p>
  );

export interface DecisionGraphDeleteDialogProps extends DialogBase {
  name: string;
  /** The decisions that use it, or unknown to a view that does not see the graph. */
  users:
    | { kind: 'known'; usedBy: readonly Pick<DecisionGraphDecisionNode, 'id' | 'label'>[] }
    | { kind: 'unknown' };
  onConfirm: () => void;
}

/** Asks before a decision is deleted, naming the decisions that use it. */
export const DecisionGraphDeleteDialog: React.FC<DecisionGraphDeleteDialogProps> = ({
  labels,
  refusal,
  onClose,
  onCloseAutoFocus,
  name,
  users,
  onConfirm,
  dataTestId,
}) => {
  const refusalId = useId();
  const usedBy = users.kind === 'known' ? users.usedBy : [];
  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        onCloseAutoFocus={onCloseAutoFocus}
        {...(users.kind === 'unknown' ? { 'aria-describedby': undefined } : {})}
        data-testid={dataTestId}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.deleteTitle(name)}</AlertDialogTitle>
          {users.kind === 'known' && (
            <AlertDialogDescription>
              {usedBy.length > 0 ? labels.deleteUsedBy : labels.deleteUnused}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {usedBy.length > 0 && (
          <ul
            className={cn('m-0 list-disc ps-5 text-sm', DIALOG_LIST_CLASS)}
            data-testid={`${dataTestId}-users`}
          >
            {usedBy.map(({ id, label }) => (
              <li key={id}>{label}</li>
            ))}
          </ul>
        )}
        <Refusal refusal={refusal} id={refusalId} />
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`${dataTestId}-cancel`}>
            {labels.cancel}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            aria-describedby={refusal === null ? undefined : refusalId}
            data-testid={`${dataTestId}-confirm`}
          >
            {labels.delete}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export interface DecisionGraphLinksDialogProps extends DialogBase {
  title: string;
  /** The decisions it can link to, in reading order. */
  options: readonly DecisionGraphDecisionNode[];
  /** The ids linked now, in the host's order. */
  linked: readonly string[];
  onSave: (ids: readonly string[]) => void;
}

/** Picks the decisions a decision requires, or those that require it. */
export const DecisionGraphLinksDialog: React.FC<DecisionGraphLinksDialogProps> = ({
  labels,
  refusal,
  onClose,
  onCloseAutoFocus,
  title,
  options,
  linked,
  onSave,
  dataTestId,
}) => {
  const idPrefix = useId();
  const [toggled, setToggled] = useState<ReadonlyMap<string, boolean>>(() => new Map());
  const isChecked = (id: string): boolean => toggled.get(id) ?? linked.includes(id);
  const toggle = (id: string, on: boolean) => setToggled(new Map(toggled).set(id, on));
  const save = () => {
    const kept = linked.filter(isChecked);
    const added = options.flatMap(({ id }) => (isChecked(id) && !linked.includes(id) ? [id] : []));
    onSave([...kept, ...added]);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={onCloseAutoFocus}
        aria-describedby={undefined}
        data-testid={dataTestId}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {options.length === 0 ? (
          <p className="m-0 text-sm text-foreground-de-emp">{labels.noOtherDecisions}</p>
        ) : (
          <ul className={cn('m-0 flex list-none flex-col gap-2 p-0', DIALOG_LIST_CLASS)}>
            {options.map(({ id, label }) => (
              <li key={id} className="flex items-center gap-2">
                <Checkbox
                  id={`${idPrefix}-${id}`}
                  checked={isChecked(id)}
                  onCheckedChange={(state) => toggle(id, state === true)}
                  data-testid={`${dataTestId}-option-${id}`}
                />
                <Label htmlFor={`${idPrefix}-${id}`}>{label}</Label>
              </li>
            ))}
          </ul>
        )}
        <Refusal refusal={refusal} id={`${idPrefix}-refusal`} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid={`${dataTestId}-cancel`}>
            {labels.cancel}
          </Button>
          <Button onClick={save} data-testid={`${dataTestId}-save`}>
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
