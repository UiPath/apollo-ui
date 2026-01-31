import * as Icons from '@uipath/apollo-react/canvas/icons';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FloatingCanvasPanel } from '../../FloatingCanvasPanel';
import {
  type AgentNodeTranslations,
  DefaultSuggestionTranslations,
  type SuggestionTranslations,
  type SuggestionType,
} from '../../../types';
import { NewBaseNode } from '../../BaseNode/NewBaseNode';
import type {
  HandleConfiguration,
  NewBaseNodeData,
  NewBaseNodeDisplayProps,
  NodeAdornment,
} from '../../BaseNode/NewBaseNode.types';
import type { ButtonHandleConfig, HandleActionEvent } from '../../ButtonHandle/ButtonHandle';
import { ExecutionStatusIcon } from '../../ExecutionStatusIcon/ExecutionStatusIcon';
import type { NodeToolbarConfig, ToolbarAction } from '../../Toolbar';
import { ResourceNodeType } from '../AgentFlow.constants';
import { useAgentFlowStore } from '../store/agent-flow-store';
import {
  AddInstructionsButton,
  HealthScoreBadge,
  InstructionsLabel,
  InstructionsLine,
  InstructionsPreview,
  SettingsPreviewContainer,
  SettingsPreviewHeader,
  SettingsPreviewSubtitle,
  SettingsPreviewTitle,
  SettingsPromptBox,
  SettingsRow,
  SettingsRowLabel,
  SettingsRowValue,
  SettingsSection,
  SettingsSectionLabel,
  SettingsSectionValue,
  SubLabelContainer,
} from './AgentNode.styles';

const { ConversationalAgentIcon, AutonomousAgentIcon } = Icons;

interface AgentNodeData extends NewBaseNodeData {
  name: string;
  description: string;
  definition: Record<string, unknown>;
  parentNodeId?: string;
  isConversational?: boolean;
  instructions?: {
    system?: string;
    user?: string;
  };
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
  onAddInstructions?: () => void;
  translations: AgentNodeTranslations;
  enableMemory?: boolean;
  enableInstructions?: boolean;
  healthScore?: number;
  onHealthScoreClick?: () => void;
  suggestionTranslations?: SuggestionTranslations;
  /** Supports versioning so we can show/hide individual suggestion level actions if supported by the integration */
  suggestionGroupVersion?: string;
}

const HOVER_DELAY_MS = 500;

const AgentNodeComponent = memo((props: NodeProps<Node<AgentNodeData>> & AgentNodeProps) => {
  const {
    id,
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
    onAddInstructions,
    translations,
    enableMemory,
    enableInstructions = false,
    healthScore,
    onHealthScoreClick,
    suggestionTranslations,
    suggestionGroupVersion,
    ...nodeProps
  } = props;
  const { actOnSuggestion } = useAgentFlowStore();

  const [showSettingsPreview, setShowSettingsPreview] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { name, definition, suggestionId } = data;
  const isSuggestion = data.isSuggestion ?? false;
  const suggestionType = isSuggestion ? data.suggestionType : undefined;
  const isConversational =
    (definition?.metadata as Record<string, unknown>)?.isConversational === true;
  const suggestTranslations = suggestionTranslations ?? DefaultSuggestionTranslations;

  // Extract settings from definition
  const settings = definition?.settings as
    | { model?: string; temperature?: number; maxTokens?: number; maxIteration?: number }
    | undefined;

  const handleMouseEnter = useCallback(() => {
    if (!enableInstructions) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSettingsPreview(true);
    }, HOVER_DELAY_MS);
  }, [enableInstructions]);

  const handleMouseLeave = useCallback(() => {
    if (!enableInstructions) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowSettingsPreview(false);
  }, [enableInstructions]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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

  const healthScoreBadge = useMemo(() => {
    if (healthScore === undefined) {
      return null;
    }
    return (
      <HealthScoreBadge
        onClick={(e) => {
          if (onHealthScoreClick) {
            e.stopPropagation();
            onHealthScoreClick();
          }
        }}
      >
        <Icons.HealthScoreIcon w={14} h={14} />
        {healthScore.toString()}
      </HealthScoreBadge>
    );
  }, [healthScore, onHealthScoreClick]);

  const { instructionsFooter, footerVariant } = useMemo((): {
    instructionsFooter: React.ReactNode;
    footerVariant: 'none' | 'button' | 'single' | 'double';
  } => {
    if (!enableInstructions) {
      return { instructionsFooter: null, footerVariant: 'none' };
    }

    const system = data.instructions?.system;
    const user = data.instructions?.user;
    const hasSystem = Boolean(system);
    const hasUser = Boolean(user);
    const hasContent = hasSystem || hasUser;

    if (hasContent) {
      return {
        instructionsFooter: (
          <InstructionsPreview
            onClick={(e) => {
              e.stopPropagation();
              onAddInstructions?.();
            }}
          >
            <InstructionsLabel>{translations.instructions}</InstructionsLabel>
            {system && (
              <InstructionsLine>
                <strong>{translations.system}:</strong> "{system}"
              </InstructionsLine>
            )}
            {user && (
              <InstructionsLine>
                <strong>{translations.user}:</strong> "{user}"
              </InstructionsLine>
            )}
          </InstructionsPreview>
        ),
        footerVariant: hasSystem && hasUser ? 'double' : 'single',
      };
    }

    // Show add button in design mode when no content
    if (mode !== 'design' || !onAddInstructions) {
      return { instructionsFooter: null, footerVariant: 'none' };
    }
    return {
      instructionsFooter: (
        <AddInstructionsButton
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddInstructions();
          }}
        >
          <ApIcon name="add" size="14px" />
          {translations.addInstructions}
        </AddInstructionsButton>
      ),
      footerVariant: 'button',
    };
  }, [enableInstructions, data.instructions, mode, onAddInstructions, translations]);

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

  const settingsPreviewContent = useMemo(() => {
    const systemPrompt = data.instructions?.system ?? '';
    const userPrompt = data.instructions?.user ?? '';

    return (
      <SettingsPreviewContainer>
        <SettingsPreviewHeader>
          <SettingsPreviewTitle>{translations.agentSettings}</SettingsPreviewTitle>
          <SettingsPreviewSubtitle>{translations.readOnlyPreview}</SettingsPreviewSubtitle>
        </SettingsPreviewHeader>

        {settings?.model && (
          <SettingsSection>
            <SettingsSectionLabel>{translations.model}</SettingsSectionLabel>
            <SettingsSectionValue>{settings.model}</SettingsSectionValue>
          </SettingsSection>
        )}

        <SettingsSection>
          <SettingsSectionLabel>{translations.systemPrompt}</SettingsSectionLabel>
          <SettingsPromptBox isEmpty={!systemPrompt}>
            {systemPrompt || translations.notConfigured}
          </SettingsPromptBox>
        </SettingsSection>

        <SettingsSection>
          <SettingsSectionLabel>{translations.userPrompt}</SettingsSectionLabel>
          <SettingsPromptBox isEmpty={!userPrompt}>
            {userPrompt || translations.notConfigured}
          </SettingsPromptBox>
        </SettingsSection>

        {settings?.temperature !== undefined && (
          <SettingsRow>
            <SettingsRowLabel>{translations.temperature}</SettingsRowLabel>
            <SettingsRowValue>{settings.temperature}</SettingsRowValue>
          </SettingsRow>
        )}

        {settings?.maxTokens !== undefined && (
          <SettingsRow>
            <SettingsRowLabel>{translations.maxTokens}</SettingsRowLabel>
            <SettingsRowValue>{settings.maxTokens}</SettingsRowValue>
          </SettingsRow>
        )}

        {settings?.maxIteration !== undefined && (
          <SettingsRow>
            <SettingsRowLabel>{translations.maxIteration}</SettingsRowLabel>
            <SettingsRowValue>{settings.maxIteration}</SettingsRowValue>
          </SettingsRow>
        )}
      </SettingsPreviewContainer>
    );
  }, [data.instructions, settings, translations]);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <NewBaseNode
        {...nodeProps}
        id={id}
        executionStatus={executionStatus}
        suggestionType={suggestionType}
        icon={agentIcon}
        display={{
          label: name,
          subLabel: (
            <SubLabelContainer>
              {isConversational ? translations.conversationalAgent : translations.autonomousAgent}
              {healthScoreBadge}
            </SubLabelContainer>
          ),
          shape: 'rectangle',
          background: 'var(--uix-canvas-background)',
          iconBackground: 'var(--uix-canvas-background-secondary)',
          footerComponent: instructionsFooter,
          footerVariant,
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
      <FloatingCanvasPanel
        open={showSettingsPreview}
        nodeId={id}
        placement="right-start"
        offset={16}
      >
        {settingsPreviewContent}
      </FloatingCanvasPanel>
    </div>
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
    onAddInstructions,
    translations,
    enableMemory,
    enableInstructions,
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
      onAddInstructions={onAddInstructions}
      translations={translations}
      enableMemory={enableMemory}
      enableInstructions={enableInstructions}
      healthScore={healthScore}
      onHealthScoreClick={onHealthScoreClick}
      suggestionTranslations={suggestionTranslations}
      suggestionGroupVersion={suggestionGroupVersion}
    />
  );
};

export const AgentNodeElement = memo(AgentNodeWrapper);

export type { AgentNodeData, AgentNodeProps };
