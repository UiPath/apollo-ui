import { useCallback, useState, useMemo } from "react";
import { useReactFlow } from "@uipath/uix/xyflow/react";
import { nodeSchemas } from "../schemas";
import type { NodeConfigSchema, ConfigurableNode } from "../NodePropertiesPanel.types";

export function useNodeConfiguration(
  selectedNode: ConfigurableNode | undefined,
  customSchemas: Record<string, NodeConfigSchema> = {},
  enableValidation = false,
  onChange?: (nodeId: string, fieldKey: string, value: unknown) => void
) {
  const { updateNodeData } = useReactFlow();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = useMemo(() => {
    if (!selectedNode) return null;

    if (selectedNode.data.configSchema) {
      return selectedNode.data.configSchema;
    }

    const allSchemas = { ...nodeSchemas, ...customSchemas };
    const nodeType = selectedNode.type || "default";
    return allSchemas[nodeType] || allSchemas.default;
  }, [selectedNode, customSchemas]);

  const handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      if (!selectedNode?.id) return;

      updateNodeData(selectedNode.id, { [fieldKey]: value });

      if (onChange) {
        onChange(selectedNode.id, fieldKey, value);
      }

      if (enableValidation) {
        setErrors((prev) => ({ ...prev, [fieldKey]: "" }));
      }
    },
    [selectedNode?.id, updateNodeData, onChange, enableValidation]
  );

  return {
    schema,
    errors,
    setErrors,
    handleFieldChange,
  };
}
