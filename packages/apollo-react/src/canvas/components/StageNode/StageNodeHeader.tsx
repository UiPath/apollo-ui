import { Icon, Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { Button, cn } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { EntryConditionIcon, ExitConditionIcon, ReturnToOriginIcon } from '../../icons';
import { CanvasIcon } from '../../utils/icon-registry';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { getExecutionStatusColor } from '../ExecutionStatusIcon/ExecutionStatusIcon';
import {
  StageChip,
  StageHeader,
  StageHeaderChipsRow,
  StageTitleContainer,
  StageTitleInput,
} from './StageNode.styles';
import type { StageNodeProps, StageSlaIcon, StageStatus } from './StageNode.types';
import { StageHeaderChipType } from './StageNode.types';

const SLA_ICON_CONFIG: Record<StageSlaIcon, { icon: string; iconColor: string }> = {
  warning: {
    icon: 'triangle-alert',
    iconColor: 'var(--canvas-warning-icon)',
  },
  error: {
    icon: 'circle-alert',
    iconColor: 'var(--canvas-error-icon)',
  },
};

const CHIP_ICONS: Record<StageHeaderChipType, React.ReactElement> = {
  [StageHeaderChipType.Entry]: <EntryConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Exit]: <ExitConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.ReturnToOrigin]: <ReturnToOriginIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.CaseExit]: <CanvasIcon icon="x" size={16} />,
  [StageHeaderChipType.CaseCompletion]: <CanvasIcon icon="check" size={16} />,
};

const StageNodeHeaderInner = ({
  props,
  isReadOnly,
  isException,
  status,
  handleTaskAddClick,
}: {
  props: StageNodeProps;
  isReadOnly: boolean;
  isException?: boolean;
  status?: StageStatus;
  handleTaskAddClick: (event: React.MouseEvent) => void;
}) => {
  const {
    id,
    stageDetails,
    execution,
    addTaskLabel = 'Add task',
    onTaskAdd,
    onAddTaskFromToolbox,
    onStageTitleChange,
    loadingTaskIds,
  } = props;

  const isAddTaskDisabled = (loadingTaskIds?.size ?? 0) > 0;

  const icon = stageDetails?.icon;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;
  const slaText = execution?.stageStatus?.slaText;
  const slaIcon = execution?.stageStatus?.slaIcon;
  const slaIndicator = slaIcon ? SLA_ICON_CONFIG[slaIcon] : undefined;

  const isStageTitleEditable = !!onStageTitleChange && !isReadOnly;

  const [isStageTitleEditing, setIsStageTitleEditing] = useState(false);
  const stageTitleRef = useRef<HTMLInputElement>(null);

  const [label, setLabel] = useState(props.stageDetails.label);
  useEffect(() => {
    setLabel(props.stageDetails.label);
  }, [props.stageDetails.label]);

  const handleStageTitleChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setIsStageTitleEditing(true);
    setLabel((e.target as HTMLInputElement).value);
  }, []);

  const handleStageTitleClickToSave = useCallback(
    (e: React.FocusEvent | MouseEvent) => {
      if (isStageTitleEditing && !stageTitleRef.current?.contains(e.target as Node)) {
        setIsStageTitleEditing(false);
        if (onStageTitleChange) {
          if (label.trim() === '') setLabel('Untitled Stage');
          onStageTitleChange(label);
        }
      }
    },
    [isStageTitleEditing, onStageTitleChange, label]
  );

  useEffect(() => {
    if (isStageTitleEditing) {
      document.addEventListener('click', handleStageTitleClickToSave);
    }
    return () => {
      document.removeEventListener('click', handleStageTitleClickToSave);
    };
  }, [handleStageTitleClickToSave, isStageTitleEditing]);

  const handleStageTitleBlurToSave = useCallback(() => {
    if (isStageTitleEditing) {
      setIsStageTitleEditing(false);
      if (onStageTitleChange) {
        if (label.trim() === '') setLabel('Untitled Stage');
        onStageTitleChange(label);
      }
    }
  }, [isStageTitleEditing, onStageTitleChange, label]);

  const handleStageTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setIsStageTitleEditing(false);
        if (onStageTitleChange) {
          onStageTitleChange(label);
        }
      }
      // Prevent keyboard events from the title input from bubbling to xyflow
      // and triggering canvas-level actions like node deletion or copy/paste.
      if (e.key !== 'Escape') {
        e.stopPropagation();
      }
    },
    [onStageTitleChange, label]
  );

  return (
    <StageHeader isException={isException} data-testid={`stage-header-${id}`}>
      <Row gap={Spacing.SpacingMicro} align="center" flex={1} minW={0}>
        {icon}
        <Column py={2} flex={1} minW={0}>
          <span className={cn('text-sm', !isStageTitleEditing && 'font-bold')}>
            <CanvasTooltip content={label} placement="top" delay>
              <StageTitleContainer isEditing={isStageTitleEditing}>
                <StageTitleInput
                  name="Stage Title"
                  isStageTitleEditable={isStageTitleEditable}
                  value={label}
                  ref={stageTitleRef}
                  isEditing={isStageTitleEditing}
                  {...(onStageTitleChange && {
                    onFocus: () => setIsStageTitleEditing(true),
                    onInput: handleStageTitleChange,
                    onKeyDown: handleStageTitleKeyDown,
                    onBlur: handleStageTitleBlurToSave,
                  })}
                  readOnly={!isStageTitleEditable}
                />
              </StageTitleContainer>
            </CanvasTooltip>
          </span>
          {stageDuration && <span className="text-xs text-foreground-muted">{stageDuration}</span>}
          {slaText && (
            <span
              className="inline-flex items-center gap-1 text-xs text-foreground-muted"
              data-testid={`stage-sla-${id}`}
              data-sla-icon={slaIcon}
            >
              {slaIndicator && (
                <CanvasIcon icon={slaIndicator.icon} size={16} color={slaIndicator.iconColor} />
              )}
              {slaText}
            </span>
          )}
          {stageDetails.headerChips && stageDetails.headerChips.length > 0 && (
            <StageHeaderChipsRow>
              {stageDetails.headerChips.map((chip) => {
                const button = (
                  <StageChip
                    key={chip.type}
                    type="button"
                    aria-label={typeof chip.tooltip === 'string' ? chip.tooltip : chip.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      chip.onClick?.();
                    }}
                  >
                    {CHIP_ICONS[chip.type]}
                    {chip.count !== undefined && <span className="text-xs">{chip.count}</span>}
                  </StageChip>
                );
                if (chip.tooltip) {
                  return (
                    <CanvasTooltip key={chip.type} placement="bottom" content={chip.tooltip}>
                      {button}
                    </CanvasTooltip>
                  );
                }
                return button;
              })}
            </StageHeaderChipsRow>
          )}
        </Column>
      </Row>
      <Row gap={Spacing.SpacingMicro} align="start" py={Padding.PadS}>
        {status && (
          <CanvasTooltip content={statusLabel} placement="top">
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={statusLabel}>
              {status === 'NotExecuted' ? (
                <CanvasIcon
                  icon="hourglass"
                  size={20}
                  color={getExecutionStatusColor('NotExecuted')}
                />
              ) : (
                <ExecutionStatusIcon status={status} size={20} />
              )}
            </Button>
          </CanvasTooltip>
        )}
        {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly && (
          <CanvasTooltip content={addTaskLabel} placement="top">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleTaskAddClick}
              aria-label={addTaskLabel}
              disabled={isAddTaskDisabled}
            >
              <CanvasIcon icon="plus" size={20} />
            </Button>
          </CanvasTooltip>
        )}
      </Row>
    </StageHeader>
  );
};

export const StageNodeHeader = memo(StageNodeHeaderInner);
