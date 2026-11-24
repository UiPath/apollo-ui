import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { DecisionGraphCardActions } from './DecisionGraphCard';
import { DecisionGraphDeleteDialog } from './DecisionGraphDialogs';
import type { DecisionGraphEdit } from './decisionGraphActionTypes';
import { DELETE_KEY, deleteEntryOf, RENAME_KEY, renameEntryOf } from './decisionGraphMenuEntries';
import type { DecisionTextLabels } from './decisionTextTypes';
import type { SentenceNameToken } from './sentenceTypes';
import { onlyModifiers } from './useDecisionGraphActions';
import type { DecisionGraphLabels } from './useDecisionGraphStrings';

/** The header's Rename and Delete, each offered only when given, and the words of their refusals, as the graph words its own. */
export interface DecisionTextDecisionActions<Refusal> {
  onRenameDecision?: (name: string) => Refusal | void;
  onDeleteDecision?: () => Refusal | void;
  wordRefusal: DecisionGraphEdit<Refusal, unknown>['wordRefusal'];
}

/** The host's actions on the decision a table's header names. */
interface DecisionTextHeaderHost<Refusal> {
  onAddColumn: ((kind: SentenceNameToken['kind']) => void) | undefined;
  decision: DecisionTextDecisionActions<Refusal> | null;
}

type Surface =
  | { kind: 'none' }
  | { kind: 'rename'; draft: string; refusal: { name: string; text: string } | null }
  | { kind: 'delete'; refusal: string | null };

const NONE: Surface = { kind: 'none' };

/** The header's menu, keys and name field, and its delete dialog, from the host's actions. */
export const useDecisionTextHeaderActions = <Refusal,>({
  name,
  host,
  labels,
  graphLabels,
  toggle,
  announce,
  dataTestId,
}: {
  name: string;
  host: DecisionTextHeaderHost<Refusal>;
  announce: (text: string) => void;
  labels: Pick<DecisionTextLabels, 'bandAddInput' | 'bandAddOutput'>;
  graphLabels: DecisionGraphLabels;
  toggle: () => HTMLElement | null;
  dataTestId: string;
}): { actions: DecisionGraphCardActions | null; dialog: React.ReactNode } => {
  const [surface, setSurface] = useState<Surface>(NONE);
  const refocusRef = useRef(false);
  const { onAddColumn, decision } = host;
  const onRenameDecision = decision?.onRenameDecision;
  const onDeleteDecision = decision?.onDeleteDecision;
  const tried = (refusal: Refusal | void): string | null =>
    refusal === undefined || !decision ? null : decision.wordRefusal(refusal);
  const withdrawn =
    (surface.kind === 'rename' && !onRenameDecision) ||
    (surface.kind === 'delete' && !onDeleteDecision);
  if (withdrawn) setSurface(NONE);
  useEffect(() => {
    if (!refocusRef.current || surface.kind !== 'none') return;
    refocusRef.current = false;
    toggle()?.focus();
  });
  const startRename = () => setSurface({ kind: 'rename', draft: name, refusal: null });
  const confirmDelete = () => setSurface({ kind: 'delete', refusal: null });
  const close = (byKey: boolean) => {
    refocusRef.current = byKey;
    setSurface(NONE);
  };
  const entries = () => [
    ...(onAddColumn
      ? [
          { label: labels.bandAddInput, onClick: () => onAddColumn('input') },
          { label: labels.bandAddOutput, onClick: () => onAddColumn('output') },
        ]
      : []),
    ...(onRenameDecision ? [renameEntryOf(graphLabels, startRename)] : []),
    ...(onDeleteDecision ? [deleteEntryOf(graphLabels, confirmDelete)] : []),
  ];
  const actions: DecisionGraphCardActions | null =
    onAddColumn || onRenameDecision || onDeleteDecision
      ? {
          menuLabel: graphLabels.decisionActions(name),
          entries,
          keyShortcuts: [
            ...(onRenameDecision ? [RENAME_KEY] : []),
            ...(onDeleteDecision ? [DELETE_KEY] : []),
          ],
          onKeyDown: (event) => {
            if (!onlyModifiers(event, false, false)) return;
            if (event.key === RENAME_KEY && onRenameDecision) {
              event.preventDefault();
              startRename();
            } else if (event.key === DELETE_KEY && onDeleteDecision) {
              event.preventDefault();
              confirmDelete();
            }
          },
          nameField: graphLabels.nameField(name),
          rename:
            onRenameDecision && surface.kind === 'rename'
              ? {
                  from: name,
                  draft: surface.draft,
                  onDraft: (draft) => setSurface({ ...surface, draft }),
                  refusal: surface.refusal?.text ?? null,
                  onCommit: (next, byKey) => {
                    if (!byKey && surface.refusal?.name === next) {
                      close(false);
                      return;
                    }
                    const refusal = tried(onRenameDecision(next));
                    if (refusal !== null && byKey) {
                      setSurface({
                        kind: 'rename',
                        draft: next,
                        refusal: { name: next, text: refusal },
                      });
                      return;
                    }
                    if (refusal !== null) announce(refusal);
                    close(byKey);
                  },
                  onCancel: close,
                }
              : null,
        }
      : null;
  const dialog =
    surface.kind === 'delete' && onDeleteDecision ? (
      <DecisionGraphDeleteDialog
        labels={graphLabels}
        refusal={surface.refusal}
        onClose={() => setSurface(NONE)}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          toggle()?.focus();
        }}
        name={name}
        users={{ kind: 'unknown' }}
        onConfirm={() => {
          const refusal = tried(onDeleteDecision());
          setSurface(refusal === null ? NONE : { kind: 'delete', refusal });
        }}
        dataTestId={`${dataTestId}-delete-dialog`}
      />
    ) : null;
  return { actions, dialog };
};
