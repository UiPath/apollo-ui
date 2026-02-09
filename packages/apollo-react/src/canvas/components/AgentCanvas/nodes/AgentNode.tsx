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
import { BaseNode } from '../../BaseNode/BaseNode';
import type { BaseNodeData } from '../../BaseNode/BaseNode.types';
import type { ButtonHandleConfig, HandleActionEvent } from '../../ButtonHandle/ButtonHandle';
import type { HandleGroupManifest } from '../../../schema/node-definition';
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

interface AgentNodeData extends BaseNodeData {
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

interface AgentNodeProps {
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
const HOVER_HIDE_DELAY_MS = 300;

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

  const [isNodeHovered, setIsNodeHovered] = useState(false);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Panel shows when EITHER node or panel is hovered
  const showSettingsPreview = isNodeHovered || isPanelHovered;

  const { name, definition, suggestionId } = data;
  const isSuggestion = data.isSuggestion ?? false;
  const suggestionType = isSuggestion ? data.suggestionType : undefined;
  const isConversational =
    (definition?.metadata as Record<string, unknown>)?.isConversational === true;
  const suggestTranslations = suggestionTranslations ?? DefaultSuggestionTranslations;

  // Conditional icon based on agent type
  const agentIcon = useMemo(() => {
    if (isConversational) {
      return (
        <Icons.ConversationalAgentIcon color="var(--uix-canvas-foreground-de-emp)" w={32} h={32} />
      );
    }
    return <Icons.AutonomousAgentIcon color="var(--uix-canvas-foreground-de-emp)" w={32} h={32} />;
  }, [isConversational]);

  // Extract settings from definition
  const settings = definition?.settings as
    | { model?: string; temperature?: number; maxTokens?: number; maxIterations?: number }
    | undefined;

  const handleMouseEnter = useCallback(() => {
    if (!enableInstructions) return;
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsNodeHovered(true);
    }, HOVER_DELAY_MS);
  }, [enableInstructions]);

  const handleMouseLeave = useCallback(() => {
    if (!enableInstructions) return;
    // Clear the show timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Small delay before hiding to allow mouse to travel to panel
    hideTimeoutRef.current = setTimeout(() => {
      setIsNodeHovered(false);
    }, HOVER_HIDE_DELAY_MS);
  }, [enableInstructions]);

  const handlePanelMouseEnter = useCallback(() => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsPanelHovered(true);
  }, []);

  const handlePanelMouseLeave = useCallback(() => {
    // Small delay before hiding
    hideTimeoutRef.current = setTimeout(() => {
      setIsPanelHovered(false);
    }, HOVER_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
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
  const handleConfigurations = useMemo((): HandleGroupManifest[] => {
    const configs: HandleGroupManifest[] = [];

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

  const healthScoreBadge = useMemo(() => {
    if (healthScore === undefined) {
      return null;
    }
    return (
      <HealthScoreBadge
        onClick={(e: React.MouseEvent) => {
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

  const subLabelWithHealthScore = useMemo(() => {
    const baseSubLabel = isConversational
      ? translations.conversationalAgent
      : translations.autonomousAgent;

    if (!healthScoreBadge) {
      return baseSubLabel;
    }

    // Return composite element with both text and badge
    return (
      <SubLabelContainer>
        <span>{baseSubLabel}</span>
        {healthScoreBadge}
      </SubLabelContainer>
    );
  }, [isConversational, translations, healthScoreBadge]);

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

  const toolbarConfig = useMemo((): NodeToolbarConfig | null | undefined => {
    if (mode === 'view') {
      return null; // Explicitly disable toolbar in view mode
    }

    // If this is a suggestion, show accept/reject actions only if version it's not "0.0.1"
    if (isSuggestion && suggestionId) {
      if (suggestionGroupVersion === '0.0.1') return null;
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

    return null; // Explicitly disable toolbar for regular agent nodes
  }, [
    mode,
    isSuggestion,
    suggestionId,
    suggestionGroupVersion,
    suggestTranslations,
    handleActOnSuggestion,
  ]);

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

        {settings?.maxIterations !== undefined && (
          <SettingsRow>
            <SettingsRowLabel>{translations.maxIterations}</SettingsRowLabel>
            <SettingsRowValue>{settings.maxIterations}</SettingsRowValue>
          </SettingsRow>
        )}
      </SettingsPreviewContainer>
    );
  }, [data.instructions, settings, translations]);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <BaseNode
        {...nodeProps}
        id={id}
        type={isConversational ? 'uipath.agent.conversational' : 'uipath.agent.autonomous'}
        data={{
          ...data,
          display: {
            label: name,
            subLabel: isConversational
              ? translations.conversationalAgent
              : translations.autonomousAgent,
            shape: 'rectangle',
            background: 'var(--uix-canvas-background)',
            iconBackground: 'var(--uix-canvas-background-secondary)',
          },
        }}
        selected={selected}
        // Runtime customization props (not in data)
        executionStatusOverride={executionStatus}
        suggestionType={suggestionType}
        handleConfigurations={handleConfigurations}
        toolbarConfig={toolbarConfig}
        footerVariant={footerVariant}
        iconComponent={agentIcon}
        footerComponent={instructionsFooter}
        subLabelComponent={subLabelWithHealthScore}
        shouldShowAddButtonFn={shouldShowAddButtonFn}
        shouldShowButtonHandleNotchesFn={() => true}
      />
      <FloatingCanvasPanel
        open={showSettingsPreview}
        nodeId={id}
        placement="right-start"
        offset={16}
        onMouseEnter={handlePanelMouseEnter}
        onMouseLeave={handlePanelMouseLeave}
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
