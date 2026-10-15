import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { CircularProgress, styled } from '@mui/material';
import token from '@uipath/apollo-core';
import { getSpanIconSvg } from '@uipath/apollo-react/chat/headless/tool-call/span-icon';
import {
  getTaskUrls,
  getToolCallDurationSeconds,
  getToolCallName,
  getToolCallState,
  getToolCallValues,
  getVisibleTraceChildren,
} from '@uipath/apollo-react/chat/headless/tool-call/tool-call-model';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApToolCallProps, ITreeNode, TSpan } from './ApToolCall.types';
import { ConversationalDisplayModeTypes } from './ApToolCall.types';
import { ToolCallSection } from './components/ToolCallSection';

const Container = styled('div')({
  fontSize: token.FontFamily.FontMSize,
  padding: token.Spacing.SpacingS,
  color: 'var(--color-foreground-de-emp)',
  maxWidth: '100%',
  boxSizing: 'border-box',
});

const Header = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: token.Spacing.SpacingMicro,
  borderRadius: token.Spacing.SpacingMicro,
  marginBottom: token.Spacing.SpacingXs,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--color-background-hover)',
  },
  '&:focus-visible': {
    outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
    outlineOffset: '-1px',
  },
});

const LoadingSpinner = styled(CircularProgress)({
  width: `${token.Spacing.SpacingM} !important`,
  height: `${token.Spacing.SpacingM} !important`,
  marginRight: token.Spacing.SpacingXs,
});

const ErrorIconStyled = styled(ErrorIcon)({
  width: token.Spacing.SpacingM,
  marginRight: token.Spacing.SpacingXs,
  color: 'var(--color-error-icon)',
  fill: 'var(--color-error-icon)',
});

const SuccessIconStyled = styled(CheckCircleIcon)({
  width: token.Spacing.SpacingM,
  marginRight: token.Spacing.SpacingXs,
  color: 'var(--color-success-icon)',
  fill: 'var(--color-success-icon)',
});

const ArrowIcon = styled(KeyboardArrowDownIcon, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  marginLeft: token.Spacing.SpacingXs,
  transform: expanded ? 'rotate(180deg)' : 'none',
}));

const TraceArrowIcon = styled(KeyboardArrowRightIcon, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  transition: 'transform 0.2s ease',
  transform: expanded ? 'rotate(90deg)' : 'none',
  flexShrink: 0,
}));

const SectionsContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  marginLeft: token.Spacing.SpacingS,
  paddingLeft: token.Spacing.SpacingS,
  borderLeft: `${token.Border.BorderThickS} solid var(--color-border)`,
  maxHeight: expanded ? 'fit-content' : '0',
  overflow: 'hidden',
  transition: 'max-height 0.2s ease',
  maxWidth: `calc(100% - ${token.Spacing.SpacingBase})`,
  boxSizing: 'border-box',
  '&:focus-visible': {
    outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
    outlineOffset: '-1px',
  },
}));

const TraceItemsContainer = styled('div')({
  marginTop: token.Spacing.SpacingMicro,
  paddingLeft: token.Spacing.SpacingMicro,
});

const TraceItemContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'clickable',
})<{ clickable?: boolean }>(({ clickable }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
  marginBottom: token.Spacing.SpacingS,
  ...(clickable && {
    cursor: 'pointer',
    borderRadius: token.Spacing.SpacingMicro,
    '&:hover': { backgroundColor: 'var(--color-background-hover)' },
  }),
}));

const TraceName = styled('span')({
  display: 'inline-block',
  flex: 1,
});

const ArrowPlaceholder = styled('span')({
  width: '20px',
  flexShrink: 0,
  display: 'inline-block',
});

const TraceIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  width: '16px',
  height: '16px',
  '& svg': {
    width: '100%',
    height: '100%',
  },
});

interface TraceItemProps {
  child: ITreeNode<TSpan>;
  depth?: number;
}

const TraceItem: React.FC<TraceItemProps> = ({ child, depth = 0 }) => {
  const visibleChildren = useMemo(() => getVisibleTraceChildren(child), [child]);
  const hasChildren = visibleChildren.length > 0;
  const [itemExpanded, setItemExpanded] = useState(false);
  const iconSvg = useMemo(() => getSpanIconSvg(child.data), [child.data]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setItemExpanded((prev) => !prev);
    }
  };

  return (
    <>
      <TraceItemContainer
        clickable={hasChildren}
        style={{
          paddingLeft: depth > 0 ? `calc(${depth} * ${token.Spacing.SpacingM})` : undefined,
        }}
        onClick={hasChildren ? () => setItemExpanded((prev) => !prev) : undefined}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={hasChildren ? handleKeyDown : undefined}
        aria-expanded={hasChildren ? itemExpanded : undefined}
      >
        {hasChildren ? (
          <TraceArrowIcon fontSize="small" expanded={itemExpanded} />
        ) : (
          <ArrowPlaceholder />
        )}
        {iconSvg && <TraceIcon dangerouslySetInnerHTML={{ __html: iconSvg }} />}
        <TraceName>{child.name.replace('_', ' ')}</TraceName>
      </TraceItemContainer>
      {hasChildren &&
        itemExpanded &&
        visibleChildren.map((c) => <TraceItemContent key={c.key} child={c} depth={depth + 1} />)}
    </>
  );
};

const TraceItemContent = React.memo(TraceItem);

/**
 * ApToolCall displays tool call execution information with expandable sections
 * showing input, output, traces, and errors.
 */
export const ApToolCall = React.forwardRef<HTMLDivElement, ApToolCallProps>((props, ref) => {
  const { span, toolName, input, output, isError, startTime, endTime, displayMode } = props;
  const { _ } = useLingui();
  const [toolCallExpanded, setToolCallExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    input: false,
    traces: false,
    escalation: true,
    output: false,
    errors: false,
  });

  const taskUrls = useMemo(() => getTaskUrls(span), [span]);

  useEffect(() => {
    if (taskUrls.length > 0) {
      setToolCallExpanded(true);
    }
  }, [taskUrls]);

  const getStatus = useMemo(
    () => getToolCallState({ input, output, isError, span }),
    [input, output, isError, span]
  );

  const renderStatusIcon = useMemo(() => {
    switch (getStatus) {
      case 'loading':
        return <LoadingSpinner />;
      case 'error':
        return <ErrorIconStyled />;
      case 'success':
        return <SuccessIconStyled />;
      default:
        return null;
    }
  }, [getStatus]);

  const getStatusText = useMemo(() => {
    const toolCallName = getToolCallName({ toolName, span });

    if (getStatus === 'loading') {
      return `Running '${toolCallName}'`;
    }

    const duration = getToolCallDurationSeconds({ startTime, endTime, span });
    return `Ran '${toolCallName}' for ${duration.toFixed(2)} seconds`;
  }, [getStatus, toolName, span, startTime, endTime]);

  const values = useMemo(
    () => getToolCallValues({ input, output, isError, span }),
    [input, output, isError, span]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setToolCallExpanded(!toolCallExpanded);
      }
    },
    [toolCallExpanded]
  );

  if (displayMode === ConversationalDisplayModeTypes.ToolNameOnly) {
    return (
      <Container ref={ref}>
        <Header>
          {renderStatusIcon} {getStatusText}
        </Header>
      </Container>
    );
  }

  return (
    <Container ref={ref}>
      <Header
        onClick={() => setToolCallExpanded(!toolCallExpanded)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={toolCallExpanded}
      >
        {renderStatusIcon} {getStatusText}
        <ArrowIcon fontSize="small" expanded={toolCallExpanded} />
      </Header>

      <SectionsContainer
        expanded={toolCallExpanded}
        aria-hidden={!toolCallExpanded}
        {...(!toolCallExpanded && { inert: true })}
      >
        {values.input && (
          <ToolCallSection
            type="input"
            title={_(msg({ id: 'tool-call.input', message: 'Input' }))}
            isExpanded={expandedSections['input']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                input: !prev['input'],
              }))
            }
            data={values.input}
          />
        )}
        {displayMode === ConversationalDisplayModeTypes.FullTrace && span?.children?.length ? (
          <ToolCallSection
            type="traces"
            title={_(msg({ id: 'tool-call.traces', message: 'Traces' }))}
            isExpanded={expandedSections['traces']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                traces: !prev['traces'],
              }))
            }
          >
            <TraceItemsContainer>
              {getVisibleTraceChildren(span).map((child) => (
                <TraceItemContent key={child.key} child={child} depth={0} />
              ))}
            </TraceItemsContainer>
          </ToolCallSection>
        ) : null}
        {taskUrls.length > 0 ? (
          <ToolCallSection
            type="escalation"
            title={_(msg({ id: 'tool-call.escalation', message: 'Escalation' }))}
            isExpanded={expandedSections['escalation']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                escalation: !prev['escalation'],
              }))
            }
            data={{ taskUrls }}
          />
        ) : null}
        {values.error && (
          <ToolCallSection
            type="errors"
            title={_(msg({ id: 'tool-call.errors', message: 'Errors' }))}
            isExpanded={expandedSections['errors']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                errors: !prev['errors'],
              }))
            }
            data={values.error}
          />
        )}
        {values.output && (
          <ToolCallSection
            type="output"
            title={_(msg({ id: 'tool-call.output', message: 'Output' }))}
            isExpanded={expandedSections['output']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                output: !prev['output'],
              }))
            }
            data={values.output}
          />
        )}
      </SectionsContainer>
    </Container>
  );
});

ApToolCall.displayName = 'ApToolCall';
