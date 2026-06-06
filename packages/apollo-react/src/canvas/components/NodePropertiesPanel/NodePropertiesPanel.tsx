import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useState } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { CheckboxField, NumberField, SelectField, TextField } from './fields';
import { useNodeConfiguration, useNodeSelection } from './hooks';
import type {
  ConfigField,
  ConfigSection,
  NodePropertiesPanelProps,
} from './NodePropertiesPanel.types';

/** Width of the pinned panel in pixels. Must match minWidth in PanelContainer styles. */
const PINNED_PANEL_WIDTH = 320;

function renderField(
  field: ConfigField,
  value: unknown,
  onChange: (value: unknown) => void,
  error?: string
) {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      const textValue = typeof value === 'string' ? value : String(value ?? '');
      return <TextField field={field} value={textValue} onChange={onChange} error={error} />;
    }
    case 'select': {
      const selectValue = value as string | number | undefined;
      return <SelectField field={field} value={selectValue} onChange={onChange} error={error} />;
    }
    case 'number': {
      const numberValue = typeof value === 'number' ? value : undefined;
      return <NumberField field={field} value={numberValue} onChange={onChange} error={error} />;
    }
    case 'checkbox': {
      const boolValue = typeof value === 'boolean' ? value : !!value;
      return <CheckboxField field={field} value={boolValue} onChange={onChange} error={error} />;
    }
    default: {
      const defaultValue = String(value ?? '');
      return <TextField field={field} value={defaultValue} onChange={onChange} error={error} />;
    }
  }
}

export const NodePropertiesPanel = memo(function NodePropertiesPanel({
  nodeId,
  onClose,
  position = 'right',
  customSchemas = {},
  enableValidation = false,
  onChange,
  maintainSelection = true,
  defaultPinned = false,
  onPinnedChange,
}: NodePropertiesPanelProps) {
  const { getInternalNode } = useReactFlow();
  const { setSelectedNodeId, selectedNode } = useNodeSelection(nodeId, maintainSelection);
  const { schema, errors, handleFieldChange } = useNodeConfiguration(
    selectedNode,
    customSchemas,
    enableValidation,
    onChange
  );
  const [isPinned, setIsPinned] = useState(defaultPinned);

  const handleClose = useCallback(() => {
    setSelectedNodeId(null);
    setIsPinned(false);
    if (onClose) {
      onClose();
    }
  }, [onClose, setSelectedNodeId]);

  const handleTogglePin = useCallback(() => {
    setIsPinned((prev) => !prev);
  }, []);

  useEffect(() => {
    if (onPinnedChange) {
      onPinnedChange(isPinned);
    }
  }, [isPinned, onPinnedChange]);

  const internalNode = selectedNode ? getInternalNode(selectedNode.id) : null;

  const renderSection = (section: ConfigSection) => {
    if (!selectedNode) return null;

    return (
      <div
        key={section.id}
        className="px-4 py-4 border-b border-(--canvas-border-de-emp) last:border-b-0"
      >
        {section.title && (
          <div className="font-medium text-[14px] text-foreground mb-2">{section.title}</div>
        )}
        <div className="flex flex-col gap-4">
          {section.fields.map((field) => (
            <div key={field.key}>
              {renderField(
                field,
                selectedNode.data[field.key],
                (value) => handleFieldChange(field.key, value),
                errors[field.key]
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!selectedNode || !schema || !internalNode) {
    return null;
  }

  const headerActions = (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleTogglePin}
      title={isPinned ? 'Unpin panel' : 'Pin panel'}
    >
      <CanvasIcon icon={isPinned ? 'shrink' : 'expand'} size={16} />
    </Button>
  );

  return (
    <FloatingCanvasPanel
      open={!!selectedNode}
      nodeId={isPinned ? undefined : selectedNode.id}
      anchorRect={
        isPinned
          ? {
              x: window.innerWidth - PINNED_PANEL_WIDTH,
              y: 0,
              width: 0,
              height: window.innerHeight,
            }
          : undefined
      }
      placement={isPinned ? 'left-start' : position === 'right' ? 'right-start' : 'left-start'}
      offset={isPinned ? 0 : 20}
      title={
        selectedNode.type === 'stage'
          ? 'Stage properties'
          : `${selectedNode.type || 'Node'} Configuration`
      }
      headerActions={headerActions}
      onClose={handleClose}
      scrollKey={selectedNode.id}
      isPinned={isPinned}
    >
      {schema.sections ? (
        schema.sections.map((section) => renderSection(section))
      ) : (
        <div className="px-4 py-4">
          <div className="flex flex-col gap-4">
            {schema.fields?.map((field) => (
              <div key={field.key}>
                {selectedNode &&
                  renderField(
                    field,
                    selectedNode.data[field.key],
                    (value) => handleFieldChange(field.key, value),
                    errors[field.key]
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </FloatingCanvasPanel>
  );
});
