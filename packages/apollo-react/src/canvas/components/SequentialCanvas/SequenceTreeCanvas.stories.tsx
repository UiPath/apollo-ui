import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useRef, useState } from 'react';
import { StoryInfoPanel, withCanvasProviders } from '../../storybook-utils';
import type { SequenceStep, SlotRef } from '../../utils/sequential/sequential.types';
import { type SequenceIntent, SequenceTreeCanvas } from './SequenceTreeCanvas';

const meta: Meta = {
  title: 'Components/Canvas/SequenceTreeCanvas',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders()],
};

export default meta;
type Story = StoryObj<typeof meta>;

const step = (id: string, label: string, subLabel?: string): SequenceStep => ({
  id,
  type: 'uipath.script',
  label,
  ...(subLabel ? { subLabel } : {}),
});

const initialTree: SequenceStep = {
  id: 'main',
  type: 'uipath.script',
  label: 'Main',
  slots: [
    {
      name: 'Activities',
      steps: [
        step('read', 'Read Range', '"Invoices.xlsx"'),
        {
          id: 'each',
          type: 'uipath.control-flow.foreach',
          label: 'For Each Row',
          subLabel: 'invoices.Rows',
          slots: [
            {
              name: 'Body',
              label: 'Body',
              steps: [
                {
                  id: 'check',
                  type: 'uipath.control-flow.decision',
                  label: 'If',
                  subLabel: 'row("Amount") > 1000',
                  slots: [
                    { name: 'Then', label: 'Then', steps: [step('approve', 'Request Approval')] },
                    { name: 'Else', label: 'Else', steps: [] },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'guard',
          type: 'uipath.control-flow.try-catch',
          label: 'Try Catch',
          slots: [
            {
              name: 'Try',
              label: 'Try',
              steps: [step('send', 'Send Report', 'manager@example.com')],
            },
            {
              name: 'Catches[0]',
              label: 'Catch (Exception)',
              steps: [step('log', 'Log Message', '"Report failed"')],
            },
            { name: 'Finally', label: 'Finally', steps: [] },
          ],
        },
        step('done', 'Write Line', '"Done"'),
      ],
    },
  ],
};

/** Removes the step `id` from the tree; returns it and the tree without it. */
function detach(tree: SequenceStep, id: string): [SequenceStep | undefined, SequenceStep] {
  let found: SequenceStep | undefined;
  const walk = (node: SequenceStep): SequenceStep => ({
    ...node,
    slots: node.slots?.map((slot) => ({
      ...slot,
      steps: slot.steps
        .filter((child) => {
          if (child.id !== id) return true;
          found = child;
          return false;
        })
        .map(walk),
    })),
  });
  const without = walk(tree);
  return [found, without];
}

/** Puts `added` into the slot `at` names. */
function attach(tree: SequenceStep, added: SequenceStep, at: SlotRef): SequenceStep {
  const walk = (node: SequenceStep): SequenceStep => ({
    ...node,
    slots: node.slots?.map((slot) => {
      if (node.id !== at.parentId || slot.name !== at.slot)
        return { ...slot, steps: slot.steps.map(walk) };
      const index = at.after === null ? 0 : slot.steps.findIndex((s) => s.id === at.after) + 1;
      const steps = slot.steps.map(walk);
      steps.splice(index, 0, added);
      return { ...slot, steps };
    }),
  });
  return walk(tree);
}

function rename(tree: SequenceStep, id: string, label: string): SequenceStep {
  const walk = (node: SequenceStep): SequenceStep => ({
    ...(node.id === id ? { ...node, label } : node),
    slots: node.slots?.map((slot) => ({ ...slot, steps: slot.steps.map(walk) })),
  });
  return walk(tree);
}

/**
 * A host in a few lines: it owns the tree, applies each intent, and sends the new tree back. A
 * real host (Studio) turns the same intents into edits of its own model.
 */
function TreeHostStory() {
  const [tree, setTree] = useState(initialTree);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [lastIntent, setLastIntent] = useState<SequenceIntent | undefined>(undefined);
  const counter = useRef(0);

  const onIntent = useCallback((intent: SequenceIntent) => {
    setLastIntent(intent);
    switch (intent.type) {
      case 'insert': {
        counter.current += 1;
        const added = step(`new-${counter.current}`, `New step ${counter.current}`);
        setTree((current) => attach(current, added, intent.at));
        setSelectedIds([added.id]);
        return;
      }
      case 'move':
        setTree((current) => {
          const [moved, without] = detach(current, intent.id);
          return moved ? attach(without, moved, intent.to) : current;
        });
        return;
      case 'remove':
        setTree((current) => detach(current, intent.id)[1]);
        setSelectedIds([]);
        return;
      case 'rename':
        setTree((current) => rename(current, intent.id, intent.label));
        return;
      case 'select':
        setSelectedIds(intent.ids);
        return;
      case 'collapse':
        setCollapsedIds((current) =>
          intent.collapsed ? [...current, intent.id] : current.filter((id) => id !== intent.id)
        );
        return;
      case 'open':
        return;
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StoryInfoPanel title="Sequence tree canvas">
        The host owns a tree of steps and applies what the canvas asks. Use a plus button or an Add
        step row to insert, the step menu or Alt and an arrow key to move, Delete to remove, and the
        gutter to collapse. Last intent:{' '}
        <code>{lastIntent ? JSON.stringify(lastIntent) : 'none yet'}</code>
      </StoryInfoPanel>
      <div style={{ flex: 1, minHeight: 0 }}>
        <SequenceTreeCanvas
          root={tree}
          mode="design"
          selectedIds={selectedIds}
          collapsedIds={collapsedIds}
          onIntent={onIntent}
        />
      </div>
    </div>
  );
}

export const TreeHost: Story = {
  name: 'Tree host',
  render: () => <TreeHostStory />,
};
