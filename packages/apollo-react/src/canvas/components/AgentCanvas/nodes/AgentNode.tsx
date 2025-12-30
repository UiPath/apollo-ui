import { memo, useCallback, useMemo } from 'react';
import { Position } from '@uipath/uix/xyflow/react';
import type { NodeProps, Node } from '@uipath/uix/xyflow/react';
import { Icons } from '@uipath/uix/core';
import { NewBaseNode } from '../../BaseNode/NewBaseNode';
import type {
  NewBaseNodeData,
  NewBaseNodeDisplayProps,
  HandleConfiguration,
  NodeAdornment,
} from '../../BaseNode/NewBaseNode.types';
import type { ButtonHandleConfig, HandleActionEvent } from '../../ButtonHandle/ButtonHandle';
import {
  DefaultSuggestionTranslations,
  type AgentNodeTranslations,
  type SuggestionTranslations,
  type SuggestionType,
} from '../../../types';
import { ResourceNodeType } from '../AgentFlow.constants';
import { ExecutionStatusIcon } from '../../ExecutionStatusIcon/ExecutionStatusIcon';
import { ApIcon } from '@uipath/portal-shell-react';
import type { NodeToolbarConfig, ToolbarAction } from '../../NodeToolbar/NodeToolbar.types';
import { useAgentFlowStore } from '../store/agent-flow-store';

const { ConversationalAgentIcon, AutonomousAgentIcon } = Icons;

interface AgentNodeData extends NewBaseNodeData {
  name: string;
  description: string;
  definition: Record<string, unknown>;
  parentNodeId?: string;
  isConversational?: boolean;
  // suggestions
  isSuggestion?: boolean;
  suggestionId?: string;
  suggestionType?: SuggestionType;
}

interface AgentNodeProps extends NewBaseNodeDisplayProps {
  data: AgentNodeData;
  selected?: boolean;
  mode?: 'design' | 'view';
  hasMemory?: boolean;
  hasContext?: boolean;
  hasEscalation?: boolean;
  hasTool?: boolean;
  hasMcp?: boolean;
  mcpEnabled?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onAddResource?: (type: 'context' | 'escalation' | 'mcp' | 'tool' | 'memorySpace') => void;
  translations: AgentNodeTranslations;
  enableMemory?: boolean;
  healthScore?: number;
  onHealthScoreClick?: () => void;
  suggestionTranslations?: SuggestionTranslations;
  /** Supports versioning so we can show/hide individual suggestion level actions if supported by the integration */
  suggestionGroupVersion?: string;
}

const AgentNodeComponent = memo((props: NodeProps<Node<AgentNodeData>> & AgentNodeProps) => {
  const {
    data,
    selected = false,
    mode = 'design',
    hasMemory = false,
    hasContext = false,
    hasEscalation = false,
    hasTool = false,
    hasMcp = false,
    mcpEnabled = true,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    onAddResource,
    translations,
    enableMemory,
    healthScore,
    onHealthScoreClick,
    suggestionTranslations,
    suggestionGroupVersion,
    ...nodeProps
  } = props;
  const { actOnSuggestion } = useAgentFlowStore();

  const { name, definition, suggestionId } = data;
  const isSuggestion = data.isSuggestion ?? false;
  const suggestionType = isSuggestion ? data.suggestionType : undefined;
  const isConversational =
    (definition?.metadata as Record<string, unknown>)?.isConversational === true;
  const suggestTranslations = suggestionTranslations ?? DefaultSuggestionTranslations;

  const executionStatus = useMemo(() => {
    if (hasError) return 'Failed';
    if (hasSuccess) return 'Completed';
    if (hasRunning) return 'InProgress';
    return undefined;
  }, [hasError, hasSuccess, hasRunning]);

  const displayMemory =
    enableMemory === true && (mode === 'design' || (mode === 'view' && hasMemory));
  const displayContext = mode === 'design' || (mode === 'view' && hasContext);
  const displayEscalation = mode === 'design' || (mode === 'view' && hasEscalation);
  const displayTool = mode === 'design' || (mode === 'view' && hasTool);
  const isMcpEnabled = mcpEnabled !== false;
  const displayMcp = (mode === 'design' && isMcpEnabled) || (mode === 'view' && !!hasMcp);

  // Create handle configurations
  const handleConfigurations = useMemo((): HandleConfiguration[] => {
    const configs: HandleConfiguration[] = [];

    // Top handles (Memory, Escalation)
    const topHandles: ButtonHandleConfig[] = [];
    // Bottom handles (Context, Tool)
    const bottomHandles: ButtonHandleConfig[] = [];

    if (displayMemory) {
      topHandles.push({
        id: ResourceNodeType.MemorySpace,
        type: 'source',
        handleType: 'artifact',
        label: translations.memory,
        showButton: mode === 'design' && !hasMemory,
        color: 'var(--uix-canvas-foreground-de-emp)',
        labelBackgroundColor: 'var(--uix-canvas-background-secondary)',
        visible: displayMemory,
        onAction: (_e: HandleActionEvent) => {
          onAddResource?.('memorySpace');
        },
      });
    }

    if (displayEscalation) {
      topHandles.push({
        id: ResourceNodeType.Escalation,
        type: 'source',
        handleType: 'artifact',
        label: translations.escalations,
        showButton: mode === 'design',
        color: 'var(--uix-canvas-foreground-de-emp)',
        labelBackgroundColor: 'var(--uix-canvas-background-secondary)',
        visible: displayEscalation,
        onAction: (_e: HandleActionEvent) => {
          onAddResource?.('escalation');
        },
      });
    }

    if (topHandles.length) {
      configs.push({
        position: Position.Top,
        handles: topHandles,
        visible: true,
      });
    }

    if (displayContext || displayTool || displayMcp) {
      bottomHandles.push(
        {
          id: ResourceNodeType.Context,
          type: 'source',
          handleType: 'artifact',
          label: translations.context,
          showButton: mode === 'design',
          color: 'var(--uix-canvas-foreground-de-emp)',
          labelBackgroundColor: 'var(--uix-canvas-background-secondary)',
          visible: displayContext,
          onAction: (_e: HandleActionEvent) => {
            onAddResource?.('context');
          },
        },
        {
          id: ResourceNodeType.Tool,
          type: 'source',
          handleType: 'artifact',
          label: translations.tools,
          showButton: mode === 'design',
          color: 'var(--uix-canvas-foreground-de-emp)',
          labelBackgroundColor: 'var(--uix-canvas-background-secondary)',
          visible: displayTool || displayMcp,
          onAction: (_e: HandleActionEvent) => {
            // Default to tool when both are available, or show the available option
            if (displayTool) {
              onAddResource?.('tool');
            } else if (displayMcp) {
              onAddResource?.('mcp');
            }
          },
        }
      );
      configs.push({
        position: Position.Bottom,
        handles: bottomHandles,
        visible: true,
      });
    }

    return configs;
  }, [
    mode,
    displayContext,
    displayMemory,
    displayMcp,
    displayTool,
    displayEscalation,
    hasMemory,
    onAddResource,
    translations,
  ]);

  const agentIcon = useMemo(() => {
    if (isConversational) {
      return <ConversationalAgentIcon color="var(--uix-canvas-foreground-de-emp)" w={32} h={32} />;
    }
    return <AutonomousAgentIcon color="var(--uix-canvas-foreground-de-emp)" w={32} h={32} />;
  }, [isConversational]);

  const statusAdornment = useMemo((): NodeAdornment => {
    return {
      icon: <ExecutionStatusIcon status={executionStatus} size={16} />,
    };
  }, [executionStatus]);

  const healthScoreElement = useMemo(() => {
    if (healthScore === undefined) {
      return null;
    }
    return (
      <div
        onClick={(e) => {
          if (onHealthScoreClick) {
            e.stopPropagation();
            onHealthScoreClick();
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          backgroundColor: 'var(--uix-canvas-background-secondary)',
          borderRadius: '16px',
          fontSize: '10px',
          fontWeight: '700',
          marginTop: '6px',
          textAlign: 'center',
          lineHeight: '16px',
          color: 'var(--uix-canvas-foreground-de-emp)',
          cursor: 'pointer',
        }}
      >
        <Icons.HealthScoreIcon w={16} h={16} />
        {healthScore.toString()}
      </div>
    );
  }, [healthScore, onHealthScoreClick]);

  const shouldShowAddButtonFn = (opts: { showAddButton: boolean; selected: boolean }) => {
    return opts.showAddButton || opts.selected;
  };

  const handleActOnSuggestion = useCallback(
    (suggestionId: string, action: 'accept' | 'reject') => {
      actOnSuggestion(suggestionId, action);
    },
    [actOnSuggestion]
  );

  const toolbarConfig = useMemo((): NodeToolbarConfig | undefined => {
    if (mode === 'view') {
      return undefined;
    }

    // If this is a suggestion, show accept/reject actions only if version it's not "0.0.1"
    if (isSuggestion && suggestionId) {
      if (suggestionGroupVersion === '0.0.1') return undefined;
      const rejectAction: ToolbarAction = {
        id: 'reject-suggestion',
        icon: 'close',
        label: suggestTranslations.reject,
        disabled: false,
        onAction: () => handleActOnSuggestion(suggestionId, 'reject'),
      };

      const acceptAction: ToolbarAction = {
        id: 'accept-suggestion',
        icon: 'check',
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

    return undefined;
  }, [
    mode,
    isSuggestion,
    suggestionId,
    suggestionGroupVersion,
    suggestTranslations,
    handleActOnSuggestion,
  ]);

  const suggestionAdornment = useMemo((): NodeAdornment => {
    if (!isSuggestion) return { icon: undefined };
    let iconName = 'swap_horizontal_circle';
    let color = 'var(--uix-canvas-warning-icon)';

    if (suggestionType === 'add') {
      iconName = 'add_circle';
      color = 'var(--uix-canvas-success-icon)';
    } else if (suggestionType === 'delete') {
      iconName = 'remove_circle';
      color = 'var(--uix-canvas-error-icon)';
    }

    return {
      icon: <ApIcon variant="normal" name={iconName} size="18px" color={color} />,
      tooltip: undefined,
    };
  }, [isSuggestion, suggestionType]);

  return (
    <NewBaseNode
      {...nodeProps}
      executionStatus={executionStatus}
      suggestionType={suggestionType}
      icon={agentIcon}
      display={{
        label: name,
        subLabel: isConversational
          ? translations.conversationalAgent
          : translations.autonomousAgent,
        shape: 'rectangle',
        background: 'var(--uix-canvas-background)',
        iconBackground: 'var(--uix-canvas-background-secondary)',
        centerAdornmentComponent: healthScoreElement,
      }}
      toolbarConfig={toolbarConfig}
      adornments={{
        topRight: statusAdornment,
        bottomLeft: suggestionAdornment,
      }}
      handleConfigurations={handleConfigurations}
      // Show add buttons in design mode even when not selected
      showHandles={mode === 'design'}
      showAddButton={mode === 'design'}
      selected={selected}
      shouldShowAddButtonFn={shouldShowAddButtonFn}
    />
  );
});

AgentNodeComponent.displayName = 'AgentNodeComponent';

const AgentNodeWrapper = (props: NodeProps<Node<AgentNodeData>> & AgentNodeProps) => {
  const {
    data,
    mode,
    hasMemory,
    hasContext,
    hasEscalation,
    hasTool,
    hasMcp,
    mcpEnabled,
    hasError,
    hasSuccess,
    hasRunning,
    onAddResource,
    translations,
    enableMemory,
    healthScore,
    onHealthScoreClick,
    suggestionTranslations,
    suggestionGroupVersion,
    ...nodeProps
  } = props;

  return (
    <AgentNodeComponent
      {...nodeProps}
      data={data}
      mode={mode}
      hasMemory={hasMemory}
      hasContext={hasContext}
      hasEscalation={hasEscalation}
      hasTool={hasTool}
      hasMcp={hasMcp}
      mcpEnabled={mcpEnabled}
      hasError={hasError}
      hasSuccess={hasSuccess}
      hasRunning={hasRunning}
      onAddResource={onAddResource}
      translations={translations}
      enableMemory={enableMemory}
      healthScore={healthScore}
      onHealthScoreClick={onHealthScoreClick}
      suggestionTranslations={suggestionTranslations}
      suggestionGroupVersion={suggestionGroupVersion}
    />
  );
};

export const AgentNodeElement = memo(AgentNodeWrapper);

export type { AgentNodeData, AgentNodeProps };
