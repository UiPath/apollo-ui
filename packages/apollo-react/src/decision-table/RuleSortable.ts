import type { useSortable } from '@dnd-kit/sortable';

/** What a rule card takes from its sortable: its node, its handle, and where the drag has it. */
export type RuleSortable = Pick<
  ReturnType<typeof useSortable>,
  | 'attributes'
  | 'listeners'
  | 'setNodeRef'
  | 'setActivatorNodeRef'
  | 'transform'
  | 'transition'
  | 'isDragging'
>;
