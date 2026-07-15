import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import { useSafeLingui } from '../../../i18n';
import { formatLeafValue, inferValueType } from './buildJsonTree';
import { JsonLeafValueEditor } from './JsonLeafValueEditor';
import type { JsonTreeNode, JsonTreeNodeType, JsonValue } from './JsonTree.types';

/** Semantic color for a rendered leaf value (also used by the wrapped-row view). */
export function valueColorClass(type: JsonTreeNodeType, value: JsonValue | undefined): string {
  if (value === null || value === undefined) return 'text-foreground-subtle';
  if (type === 'string') return 'text-success';
  if (type === 'number') return 'text-info';
  if (type === 'boolean') return value ? 'text-success' : 'text-error';
  return 'text-foreground';
}

// Editable scalar value cell: the read-only footprint plus a rounded hover
// background that signals the value is clickable. Callers add the cursor.
const VALUE_CELL_CLASS =
  'min-w-0 shrink-3 truncate rounded font-mono text-xs transition hover:bg-surface-raised';

export interface ScalarValueCellProps {
  node: JsonTreeNode;
  readOnly: boolean;
  editing: boolean;
  onStartEdit: (node: JsonTreeNode) => void;
  onStopEdit: () => void;
  onEdit?: (node: JsonTreeNode, value: JsonValue) => void;
}

/**
 * The value slot of a leaf row. Booleans toggle on a single click; schema
 * enums edit through a dropdown; strings, numbers, and null values edit
 * through an inline input. Missing values render as "unset" and editing them
 * creates the value.
 */
export function ScalarValueCell({
  node,
  readOnly,
  editing,
  onStartEdit,
  onStopEdit,
  onEdit,
}: ScalarValueCellProps) {
  const { _ } = useSafeLingui();
  const missing = node.value === undefined;
  const display = missing
    ? _({ id: 'canvas.json_value_panel.unset_value', message: 'unset' })
    : formatLeafValue(node.type, node.value);
  const colorClass = missing
    ? 'italic text-foreground-subtle'
    : valueColorClass(node.type, node.value);
  const enumOptions = node.schema?.enum;
  // Unset nodes already display as their schema type, so this also covers
  // unset booleans declared by the schema.
  const isBoolean = node.type === 'boolean';

  if (editing) {
    return (
      <JsonLeafValueEditor
        node={node}
        onCommit={(value) => {
          onStopEdit();
          onEdit?.(node, value);
        }}
        onCancel={onStopEdit}
      />
    );
  }

  // The value shrinks before the key (shrink-[3]) and truncates, so the row
  // actions stay pinned to the right edge without horizontal overflow.
  if (readOnly || !onEdit) {
    return (
      <span className={cn('min-w-0 shrink-3 truncate font-mono text-xs', colorClass)}>
        {display}
      </span>
    );
  }

  const editTitle = _({
    id: 'canvas.json_value_panel.edit_value_of',
    message: 'Edit value of {key}',
    values: { key: node.key },
  });

  // Booleans toggle on a single click (unset/false become true, true becomes
  // false). Enum-constrained booleans fall through to the dropdown below.
  if (isBoolean && !enumOptions?.length) {
    return (
      <button
        type="button"
        onClick={() => onEdit(node, node.value !== true)}
        aria-label={editTitle}
        title={_({
          id: 'canvas.json_value_panel.toggle_hint',
          message: 'Click to toggle',
        })}
        className={cn(VALUE_CELL_CLASS, 'cursor-pointer', colorClass)}
      >
        {display}
      </button>
    );
  }

  // Dropdown editing for closed value sets (schema enums).
  if (enumOptions?.length) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={editTitle}
            title={_({
              id: 'canvas.json_value_panel.edit_hint',
              message: 'Click to edit',
            })}
            className={cn(VALUE_CELL_CLASS, 'cursor-pointer', colorClass)}
          >
            {display}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-32">
          {enumOptions.map((option) => (
            <DropdownMenuItem
              key={String(option)}
              onClick={() => onEdit(node, option)}
              className={cn(
                'font-mono text-xs',
                option === node.value ? 'text-foreground' : 'text-foreground-muted'
              )}
            >
              {formatLeafValue(inferValueType(option), option)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit(node)}
      aria-label={editTitle}
      title={
        missing
          ? _({
              id: 'canvas.json_value_panel.unset_edit_hint',
              message: 'Click to set a value',
            })
          : _({
              id: 'canvas.json_value_panel.edit_hint',
              message: 'Click to edit',
            })
      }
      className={cn(VALUE_CELL_CLASS, 'cursor-text', colorClass)}
    >
      {display}
    </button>
  );
}
