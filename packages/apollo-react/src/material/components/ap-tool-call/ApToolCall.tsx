import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { CircularProgress, styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApToolCallProps, ITreeNode, TSpan } from './ApToolCall.types';
import { ConversationalDisplayModeTypes } from './ApToolCall.types';
import { ToolCallSection } from './components/ToolCallSection';
import { getSpanIconSvg } from './utils/traceIconUtils';

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

function getVisibleChildren(node: ITreeNode<TSpan>): Array<ITreeNode<TSpan>> {
  const result: Array<ITreeNode<TSpan>> = [];
  for (const child of node.children ?? []) {
    if (child.data.type !== 'llmCall' && child.data.type !== 'agentOutput') {
      result.push(child);
    }
  }
  return result;
}

interface TraceItemProps {
  child: ITreeNode<TSpan>;
  depth?: number;
}

const TraceItem: React.FC<TraceItemProps> = ({ child, depth = 0 }) => {
  const visibleChildren = useMemo(() => getVisibleChildren(child), [child]);
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
        style={{ paddingLeft: depth > 0 ? `calc(${depth} * ${token.Spacing.SpacingM})` : undefined }}
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
        {iconSvg && (
          <TraceIcon dangerouslySetInnerHTML={{ __html: iconSvg }} />
        )}
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

  // Helper to safely access attributes
  const getAttributes = useCallback((data: TSpan): Record<string, any> => {
    let attrs = data.attributes;
    if (typeof attrs === 'string') {
      try {
        attrs = JSON.parse(attrs);
      } catch {
        return {};
      }
    }
    return (attrs || {}) as Record<string, any>;
  }, []);

  const taskUrls = useMemo(() => {
    if (!span) {
      return [];
    }

    const urls: Array<{ taskUrl: string; status: string | null }> = [];

    // Check parent span
    let attributes = span.data.attributes;
    if (typeof attributes === 'string') {
      try {
        attributes = JSON.parse(attributes);
      } catch {
        attributes = {};
      }
    }

    if (typeof attributes === 'object' && attributes?.taskUrl) {
      urls.push({
        taskUrl: attributes.taskUrl as string,
        status: span.data.status || null,
      });
    }

    // Check all child spans
    const visitedSpans = new Set<string>();
    const childStack = [...(span.children || [])];

    while (childStack.length > 0) {
      const child = childStack.pop();
      if (!child?.data?.id) {
        continue;
      }

      if (visitedSpans.has(child.data.id)) {
        continue;
      }
      visitedSpans.add(child.data.id);

      let childAttributes = child.data.attributes;
      if (typeof childAttributes === 'string') {
        try {
          childAttributes = JSON.parse(childAttributes);
        } catch {
          childAttributes = {};
        }
      }

      if (typeof childAttributes === 'object' && childAttributes?.taskUrl) {
        urls.push({
          taskUrl: childAttributes.taskUrl as string,
          status: child.data.status || null,
        });
      }

      if (child.children?.length) {
        childStack.push(...child.children);
      }
    }
    return urls;
  }, [span]);

  useEffect(() => {
    if (taskUrls.length > 0) {
      setToolCallExpanded(true);
    }
  }, [taskUrls]);

  // Check if the span has any child spans with an error
  const hasChildSpanWithError = useMemo(() => {
    if (!span) {
      return false;
    }

    const visitedSpans = new Set<string>();
    const childStack = [...(span.children || [])];

    while (childStack.length > 0) {
      const child = childStack.pop();
      if (!child?.data?.id) {
        continue;
      }

      if (visitedSpans.has(child.data.id)) {
        continue;
      }
      visitedSpans.add(child.data.id);

      if (child.data.status === 'error') {
        return true;
      }

      if (child.children?.length) {
        childStack.push(...child.children);
      }
    }
    return false;
  }, [span]);

  const getStatus = useMemo(() => {
    if (input && !output && isError === undefined) {
      return 'loading';
    }
    if (input && (output || isError !== undefined)) {
      return isError ? 'error' : 'success';
    }

    if (span) {
      if (span.data.status === 'unset') {
        return 'loading';
      }
      if (span.data.status === 'error' || hasChildSpanWithError) {
        return 'error';
      }
      if (span.data.status === 'ok') {
        return 'success';
      }
    }
    return null;
  }, [input, output, isError, span, hasChildSpanWithError]);

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
    const status = getStatus;
    const toolCallName =
      toolName?.replace(/_/g, ' ') ||
      span?.name?.replace('Tool call - ', '').replace(/_/g, ' ') ||
      'tool';

    if (status === 'loading') {
      return `Running '${toolCallName}'`;
    }

    // Calculate duration
    const endTimeStamp = endTime || span?.data?.endTime;
    const startTimeStamp = startTime || span?.data?.startTime;
    const duration =
      endTimeStamp && startTimeStamp
        ? (new Date(endTimeStamp).getTime() - new Date(startTimeStamp).getTime()) / 1000
        : 0;

    return `Ran '${toolCallName}' for ${duration.toFixed(2)} seconds`;
  }, [getStatus, toolName, span, startTime, endTime]);

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
        {(input || (span && getAttributes(span.data).arguments)) && (
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
            data={input || (span ? getAttributes(span.data).arguments : undefined)}
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
              {getVisibleChildren(span).map((child) => (
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
        {((isError && output) || (span && getAttributes(span.data).error)) && (
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
            data={isError && output ? output : span ? getAttributes(span.data).error : {}}
          />
        )}
        {((!isError && output) || (span && getAttributes(span.data).result)) && (
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
            data={output || (span ? getAttributes(span.data).result : {}) || {}}
          />
        )}
      </SectionsContainer>
    </Container>
  );
});

ApToolCall.displayName = 'ApToolCall';
