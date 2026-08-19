import { cn } from '@uipath/apollo-wind';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltip } from '../CanvasTooltip';
import type { JsonTreeNode } from './JsonTree.types';

export interface NodeKeyProps {
  node: JsonTreeNode;
  /** Display text overriding the raw key (decoration label). */
  label?: string;
  /** The path as it will be copied (after `pathForCopy`); shown in the tooltip. */
  displayPath?: string;
  onCopyPath?: (node: JsonTreeNode) => void;
  className?: string;
}

/**
 * The field name. Hovering underlines it and (after a short delay) shows a
 * popover titled with the node's full tree path, plus the schema description
 * and a copy hint; clicking copies the path.
 */
export function NodeKey({ node, label, displayPath, onCopyPath, className }: NodeKeyProps) {
  const { _ } = useSafeLingui();
  const text = label ?? node.key;
  // The tooltip/aria surface the exact string that gets copied so it matches
  // consumer path transforms (e.g. a `$vars.` prefix), not the raw tree path.
  const copyPathText = displayPath ?? node.path;
  // The value gives way first (it shrinks harder), then the key truncates. Only
  // once both are at their floors does the row overflow and push the trailing
  // actions out of the tree's clipped viewport, so the actions survive far
  // narrower panels than a key that refused to shrink at all. The floor is
  // deliberately below the shortest keys in practice: `min-width` is also a
  // size floor, so a larger one would pad every short key at every width.
  // `max-w-[45%]` still caps a pathologically long key.
  // Display labels render in the UI font to set them apart from raw keys.
  const keyClass = cn(
    'min-w-4 max-w-[45%] truncate text-xs text-foreground',
    label != null ? 'font-medium' : 'font-mono',
    node.value === undefined && 'text-foreground-muted',
    className
  );
  if (!onCopyPath) return <span className={keyClass}>{text}</span>;

  return (
    <CanvasTooltip
      placement="top"
      delay
      content={
        <div className="flex max-w-60 flex-col gap-1">
          <span className="break-all font-mono text-xs font-semibold leading-4">
            {copyPathText}
          </span>
          {node.schema?.description && (
            <span className="text-xs leading-4">{node.schema.description}</span>
          )}
          <span className="text-[11px] leading-4 opacity-70">
            {_({
              id: 'canvas.json_value_panel.copy_path_hint',
              message: 'Click to copy this path',
            })}
          </span>
        </div>
      }
    >
      <button
        type="button"
        onClick={() => onCopyPath(node)}
        aria-label={_({
          id: 'canvas.json_value_panel.copy_path_for',
          message: 'Copy path for {path}',
          values: { path: copyPathText },
        })}
        className={cn(
          keyClass,
          'cursor-pointer decoration-foreground-subtle underline-offset-2 hover:underline'
        )}
      >
        {text}
      </button>
    </CanvasTooltip>
  );
}
