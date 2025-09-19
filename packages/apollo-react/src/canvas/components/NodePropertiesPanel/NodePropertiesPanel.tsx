import { memo, useCallback } from "react";
import { useReactFlow } from "@uipath/uix-xyflow/react";
import { Column } from "@uipath/uix-core";
import { TextField, SelectField, NumberField, CheckboxField } from "./fields";
import { ConfigSection as StyledConfigSection, SectionTitle, FieldContainer } from "./NodePropertiesPanel.styles";
import { FloatingCanvasPanel } from "../FloatingCanvasPanel";
import { useNodeSelection, useNodeConfiguration } from "./hooks";
import type { NodePropertiesPanelProps, ConfigField, ConfigSection } from "./NodePropertiesPanel.types";

function renderField(field: ConfigField, value: unknown, onChange: (value: unknown) => void, error?: string) {
  switch (field.type) {
    case "text":
    case "textarea": {
      const textValue = typeof value === "string" ? value : String(value ?? "");
      return <TextField field={field} value={textValue} onChange={onChange} error={error} />;
    }
    case "select": {
      const selectValue = value as string | number | undefined;
      return <SelectField field={field} value={selectValue} onChange={onChange} error={error} />;
    }
    case "number": {
      const numberValue = typeof value === "number" ? value : undefined;
      return <NumberField field={field} value={numberValue} onChange={onChange} error={error} />;
    }
    case "checkbox": {
      const boolValue = typeof value === "boolean" ? value : !!value;
      return <CheckboxField field={field} value={boolValue} onChange={onChange} error={error} />;
    }
    default: {
      const defaultValue = String(value ?? "");
      return <TextField field={field} value={defaultValue} onChange={onChange} error={error} />;
    }
  }
}

export const NodePropertiesPanel = memo(function NodePropertiesPanel({
  nodeId,
  onClose,
  position = "right",
  customSchemas = {},
  enableValidation = false,
  onChange,
  maintainSelection = true,
}: NodePropertiesPanelProps) {
  const { getInternalNode } = useReactFlow();
  const { setSelectedNodeId, selectedNode } = useNodeSelection(nodeId, maintainSelection);
  const { schema, errors, handleFieldChange } = useNodeConfiguration(selectedNode, customSchemas, enableValidation, onChange);

  const handleClose = useCallback(() => {
    setSelectedNodeId(null);
    if (onClose) {
      onClose();
    }
  }, [onClose, setSelectedNodeId]);

  const internalNode = selectedNode ? getInternalNode(selectedNode.id) : null;

  const renderSection = (section: ConfigSection) => {
    if (!selectedNode) return null;

    return (
      <StyledConfigSection key={section.id}>
        {section.title && <SectionTitle>{section.title}</SectionTitle>}
        <Column gap={16}>
          {section.fields.map((field) => (
            <FieldContainer key={field.key}>
              {renderField(field, selectedNode.data[field.key], (value) => handleFieldChange(field.key, value), errors[field.key])}
            </FieldContainer>
          ))}
        </Column>
      </StyledConfigSection>
    );
  };

  if (!selectedNode || !schema || !internalNode) {
    return null;
  }

  return (
    <FloatingCanvasPanel
      open={!!selectedNode}
      nodeId={selectedNode.id}
      placement={position === "right" ? "right-start" : "left-start"}
      title={selectedNode.type === "stage" ? "Stage properties" : `${selectedNode.type || "Node"} Configuration`}
      onClose={handleClose}
      scrollKey={selectedNode.id}
    >
      {schema.sections ? (
        schema.sections.map((section) => renderSection(section))
      ) : (
        <StyledConfigSection>
          <Column gap={16}>
            {schema.fields?.map((field) => (
              <FieldContainer key={field.key}>
                {selectedNode &&
                  renderField(field, selectedNode.data[field.key], (value) => handleFieldChange(field.key, value), errors[field.key])}
              </FieldContainer>
            ))}
          </Column>
        </StyledConfigSection>
      )}
    </FloatingCanvasPanel>
  );
});
