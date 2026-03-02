import * as Icons from '@uipath/apollo-react/canvas/icons';
import { NodeIcon } from '@uipath/apollo-react/canvas/utils';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { type NodeProps, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { memo, useCallback, useMemo } from 'react';
import {
  type AgentFlowResourceNode,
  type AgentFlowResourceNodeData,
  DefaultSuggestionTranslations,
  type ResourceNodeTranslations,
  type SuggestionTranslations,
} from '../../../types';
import { BaseNode } from '../../BaseNode/BaseNode';
import {
  BaseNodeOverrideConfigProvider,
  type BaseNodeOverrideConfig,
} from '../../BaseNode/BaseNodeConfigContext';
import type { ButtonHandleConfig } from '../../ButtonHandle';
import type { HandleGroupManifest } from '../../../schema/node-definition';
import { ExecutionStatusIcon } from '../../ExecutionStatusIcon/ExecutionStatusIcon';
import type { NodeToolbarConfig, ToolbarAction } from '../../Toolbar';
import { ToolResourceIcon } from '../components/ToolResourceIcon';
import { useAgentFlowStore, useEdges } from '../store/agent-flow-store';

const alwaysShowNotches = () => true;

interface ResourceNodeProps extends NodeProps<AgentFlowResourceNode> {
  mode?: 'design' | 'view';
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onEnable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onDisable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToSource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onErrorAction?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveResource?: (resourceId: string) => void;
  translations?: ResourceNodeTranslations;
  suggestionTranslations?: SuggestionTranslations;
  /** Supports versioning so we can show/hide individual suggestion level actions if supported by the integration */
  suggestionGroupVersion?: string;
}

export const ResourceNode = memo(
  ({
    data,
    selected,
    id,
    mode,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    onEnable,
    onDisable,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onAddGuardrail,
    onGoToSource,
    onErrorAction,
    translations,
    suggestionTranslations,
    suggestionGroupVersion,
    ...nodeProps
  }: ResourceNodeProps) => {
    const { nodes: _nodes, deleteNode, actOnSuggestion } = useAgentFlowStore();
    const edges = useEdges();

    // Find which handle position has a connection for this node
    const connectedHandlePosition = useMemo(() => {
      const nodeEdge = edges.find((e) => e.target === id);
      return nodeEdge?.targetHandle as Position | undefined;
    }, [edges, id]);

    const displayTooltips = mode === 'design';
    const hasBreakpoint = data.hasBreakpoint ?? false;
    const hasGuardrails = data.hasGuardrails ?? false;
    const isCurrentBreakpoint = data.isCurrentBreakpoint ?? false;
    const isDisabled = data.isDisabled ?? false;
    const isSuggestion = data.isSuggestion ?? false;
    const suggestionId = data.suggestionId;
    const suggestionType = isSuggestion ? data.suggestionType : undefined;
    const suggestTranslations = suggestionTranslations ?? DefaultSuggestionTranslations;
    const errorAction = data.errorAction ?? undefined;

    const handleClickEnable = useCallback(() => {
      onEnable?.(id, data);
    }, [id, data, onEnable]);

    const handleClickDisable = useCallback(() => {
      onDisable?.(id, data);
    }, [id, data, onDisable]);

    const handleClickAddBreakpoint = useCallback(() => {
      onAddBreakpoint?.(id, data);
    }, [id, data, onAddBreakpoint]);

    const handleClickRemoveBreakpoint = useCallback(() => {
      onRemoveBreakpoint?.(id, data);
    }, [id, data, onRemoveBreakpoint]);

    const handleClickAddGuardrail = useCallback(() => {
      onAddGuardrail?.(id, data);
    }, [id, data, onAddGuardrail]);

    const handleClickGoToSource = useCallback(() => {
      onGoToSource?.(id, data);
    }, [id, data, onGoToSource]);

    const handleClickRemove = useCallback(() => {
      deleteNode(id);
    }, [id, deleteNode]);

    const handleClickErrorAction = useCallback(() => {
      onErrorAction?.(id, data);
    }, [id, data, onErrorAction]);

    const handleActOnSuggestion = useCallback(
      (suggestionId: string, action: 'accept' | 'reject') => {
        actOnSuggestion(suggestionId, action);
      },
      [actOnSuggestion]
    );

    const executionStatus = useMemo(() => {
      if (isCurrentBreakpoint) return 'Paused';
      if (hasError) return 'Failed';
      if (hasSuccess) return 'Completed';
      if (hasRunning) return 'InProgress';
      return undefined;
    }, [hasError, hasSuccess, hasRunning, isCurrentBreakpoint]);

    const resourceIcon = useMemo(() => {
      let icon: React.ReactNode | undefined;
      switch (data.type) {
        case 'context':
          icon = <ApIcon name="description" size="40px" />;
          break;
        case 'escalation':
          icon = <ApIcon name="person" size="40px" />;
          break;
        case 'memorySpace':
          icon = <Icons.MemoryIcon w={40} h={40} />;
          break;
        case 'mcp':
          icon = <Icons.McpIcon w={40} h={40} />;
          break;
        case 'tool':
          icon = <ToolResourceIcon size={48} tool={data} />;
          break;
        default:
          icon = undefined;
          break;
      }
      return icon ? (
        <Row style={{ color: 'var(--uix-canvas-foreground-de-emp)' }}>{icon}</Row>
      ) : null;
    }, [data]);

    const toolbarConfig = useMemo((): NodeToolbarConfig | null | undefined => {
      // Explicitly disable toolbar in view mode or for placeholder nodes
      if (mode === 'view' || (data.isPlaceholder && (!isSuggestion || !suggestionId))) {
        return null;
      }

      // If this is a suggestion, show accept/reject actions only if version is not "0.0.1"
      if (isSuggestion && suggestionId) {
        if (suggestionGroupVersion === '0.0.1') return null;
        const rejectAction: ToolbarAction = {
          id: 'reject-suggestion',
          icon: <NodeIcon icon="X" size={14} />,
          label: suggestTranslations.reject,
          disabled: false,
          onAction: () => handleActOnSuggestion(suggestionId, 'reject'),
        };

        const acceptAction: ToolbarAction = {
          id: 'accept-suggestion',
          icon: <NodeIcon icon="check" size={14} />,
          label: suggestTranslations.accept,
          disabled: false,
          onAction: () => handleActOnSuggestion(suggestionId, 'accept'),
        };

        return {
          actions: [rejectAction, acceptAction],
          overflowActions: [],
          overflowLabel: '',
          position: 'top',
          align: 'center',
        };
      }

      const toggleBreakpointAction: ToolbarAction = {
        id: 'toggle-breakpoint',
        icon: undefined,
        label: (hasBreakpoint ? translations?.removeBreakpoint : translations?.addBreakpoint) ?? '',
        disabled: false,
        onAction: hasBreakpoint ? handleClickRemoveBreakpoint : handleClickAddBreakpoint,
      };

      const addGuardrailAction: ToolbarAction = {
        id: 'add-guardrail',
        icon: undefined,
        label: translations?.addGuardrail ?? '',
        disabled: false,
        onAction: handleClickAddGuardrail,
      };

      const goToSourceAction: ToolbarAction = {
        id: 'go-to-source',
        icon: undefined,
        label: translations?.goToSource ?? '',
        disabled: false,
        onAction: handleClickGoToSource,
      };

      const removeAction: ToolbarAction = {
        id: 'remove',
        icon: <NodeIcon icon="trash" size={14} />,
        label: translations?.remove ?? '',
        disabled: false,
        onAction: handleClickRemove,
      };

      const errorCtaAction: ToolbarAction = {
        id: 'error-cta',
        icon: errorAction?.icon ?? '',
        label: errorAction?.label ?? '',
        disabled: false,
        onAction: handleClickErrorAction,
      };

      const toggleEnabledAction: ToolbarAction = {
        id: 'toggle-enabled',
        icon: undefined,
        label: (isDisabled ? translations?.enable : translations?.disable) ?? '',
        disabled: false,
        onAction: isDisabled ? handleClickEnable : handleClickDisable,
      };

      const separator: ToolbarAction = {
        id: 'separator',
        icon: undefined,
        label: undefined,
        disabled: false,
        onAction: () => {},
      };

      // Only show error CTA if `errorAction` is provided in data
      // Consumers need to conditionally pass this prop if they want to show the error CTA
      const actions: ToolbarAction[] = [removeAction, ...(errorAction ? [errorCtaAction] : [])];

      const overflowActions: ToolbarAction[] = [
        toggleBreakpointAction,
        ...(data.type === 'tool' ? [addGuardrailAction] : []),
        ...(data.projectId ? [goToSourceAction] : []),
        ...(data.type === 'tool' ? [separator, toggleEnabledAction] : []),
      ];

      return {
        actions,
        overflowActions,
        overflowLabel: translations?.moreOptions ?? '',
        position: 'top',
        align: 'center',
      };
    }, [
      mode,
      data.projectId,
      data.type,
      data.isPlaceholder,
      hasBreakpoint,
      isDisabled,
      isSuggestion,
      suggestionId,
      suggestionGroupVersion,
      handleClickEnable,
      handleClickDisable,
      handleClickRemoveBreakpoint,
      handleClickAddBreakpoint,
      translations,
      handleClickAddGuardrail,
      handleClickGoToSource,
      handleClickRemove,
      handleClickErrorAction,
      handleActOnSuggestion,
      suggestTranslations,
      errorAction,
    ]);

    const toolTopHandles = useMemo(
      (): ButtonHandleConfig[] => [
        {
          id: Position.Top,
          type: 'target' as const,
          handleType: 'artifact' as const,
          showButton: false,
          color: 'var(--uix-canvas-foreground-de-emp)',
        },
      ],
      []
    );

    const toolBottomHandles = useMemo(
      (): ButtonHandleConfig[] => [
        {
          id: Position.Bottom,
          type: 'source' as const,
          handleType: 'artifact' as const,
          showButton: false,
          color: 'var(--uix-canvas-foreground-de-emp)',
        },
      ],
      []
    );

    const contextHandles = useMemo(
      (): ButtonHandleConfig[] => [
        {
          id: Position.Top,
          type: 'source' as const,
          handleType: 'artifact' as const,
          showButton: false,
          color: 'var(--uix-canvas-foreground-de-emp)',
        },
      ],
      []
    );

    const escalationHandles = useMemo(
      (): ButtonHandleConfig[] => [
        {
          id: Position.Bottom,
          type: 'target' as const,
          handleType: 'artifact' as const,
          showButton: false,
          color: 'var(--uix-canvas-foreground-de-emp)',
        },
      ],
      []
    );

    const memoryHandles = useMemo(
      (): ButtonHandleConfig[] => [
        {
          id: Position.Bottom,
          type: 'target' as const,
          handleType: 'artifact' as const,
          showButton: false,
          color: 'var(--uix-canvas-foreground-de-emp)',
        },
      ],
      []
    );

    const breakpointAdornment = useMemo((): React.ReactNode => {
      if (!hasBreakpoint) return undefined;
      return <ApIcon variant="normal" name="circle" size="14px" color="#cc3d45" />;
    }, [hasBreakpoint]);

    const statusAdornment = useMemo((): React.ReactNode => {
      return <ExecutionStatusIcon status={executionStatus} size={16} />;
    }, [executionStatus]);

    const guardrailsAdornment = useMemo((): React.ReactNode => {
      if (!hasGuardrails) return undefined;
      return (
        <ApIcon
          variant="outlined"
          name="gpp_good"
          size="18px"
          color="var(--uix-canvas-icon-default)"
        />
      );
    }, [hasGuardrails]);

    const suggestionAdornment = useMemo((): React.ReactNode => {
      if (!isSuggestion) return undefined;
      let iconName = 'swap_horizontal_circle';
      let color = 'var(--uix-canvas-warning-icon)';

      if (suggestionType === 'add') {
        iconName = 'add_circle';
        color = 'var(--uix-canvas-success-icon)';
      } else if (suggestionType === 'delete') {
        iconName = 'remove_circle';
        color = 'var(--uix-canvas-error-icon)';
      }

      return <ApIcon variant="normal" name={iconName} size="18px" color={color} />;
    }, [isSuggestion, suggestionType]);

    const handleConfigurations = useMemo(
      (): HandleGroupManifest[] => [
        {
          position: Position.Top,
          handles: toolTopHandles,
          visible:
            (data.type === 'tool' || data.type === 'mcp') &&
            connectedHandlePosition === Position.Top,
        },
        ...(data.isExpandable
          ? [
              {
                position: Position.Bottom,
                handles: toolBottomHandles,
                visible:
                  (data.type === 'tool' || data.type === 'mcp') &&
                  connectedHandlePosition === Position.Bottom,
              },
            ]
          : []),
        {
          position: Position.Top,
          handles: contextHandles,
          visible: data.type === 'context' && connectedHandlePosition === Position.Top,
        },
        {
          position: Position.Bottom,
          handles: escalationHandles,
          visible: data.type === 'escalation' && connectedHandlePosition === Position.Bottom,
        },
        {
          position: Position.Bottom,
          handles: memoryHandles,
          visible: data.type === 'memorySpace' && connectedHandlePosition === Position.Bottom,
        },
      ],
      [
        data.type,
        data.isExpandable,
        connectedHandlePosition,
        toolTopHandles,
        toolBottomHandles,
        contextHandles,
        escalationHandles,
        memoryHandles,
      ]
    );

    // Map resource type to manifest type
    const getResourceNodeType = () => {
      switch (data.type) {
        case 'context':
          return 'uipath.resource.context';
        case 'tool':
          return 'uipath.resource.tool';
        case 'mcp':
          return 'uipath.resource.mcp';
        case 'escalation':
          return 'uipath.resource.escalation';
        case 'memorySpace':
          return 'uipath.resource.memory';
        default:
          return 'uipath.resource.tool'; // fallback
      }
    };

    const baseNodeConfig = useMemo<BaseNodeOverrideConfig>(
      () => ({
        labelTooltip: displayTooltips ? data.description : undefined,
        labelBackgroundColor: 'var(--uix-canvas-background-secondary)',
        disabled: isDisabled,
        executionStatusOverride: executionStatus,
        suggestionType,
        iconComponent: resourceIcon,
        handleConfigurations,
        toolbarConfig,
        adornments: {
          topLeft: breakpointAdornment,
          topRight: statusAdornment,
          bottomLeft: suggestionAdornment,
          bottomRight: guardrailsAdornment,
        },
        shouldShowButtonHandleNotchesFn: alwaysShowNotches,
      }),
      [
        displayTooltips,
        data.description,
        isDisabled,
        executionStatus,
        suggestionType,
        resourceIcon,
        handleConfigurations,
        toolbarConfig,
        breakpointAdornment,
        statusAdornment,
        suggestionAdornment,
        guardrailsAdornment,
      ]
    );

    return (
      <BaseNodeOverrideConfigProvider value={baseNodeConfig}>
        <BaseNode
          {...nodeProps}
          type={getResourceNodeType()}
          data={{
            ...data,
            display: {
              iconBackground: 'var(--uix-canvas-background-secondary)',
              label: data.name,
              subLabel: data.originalName,
              shape: 'circle',
            },
          }}
          id={id}
          selected={selected}
          draggable={false}
          selectable={true}
          deletable={!isSuggestion}
        />
      </BaseNodeOverrideConfigProvider>
    );
  }
);
