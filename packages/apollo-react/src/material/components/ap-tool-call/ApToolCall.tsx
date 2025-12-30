import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { styled, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import token from '@uipath/apollo-core';

import { ToolCallSection } from './ToolCallSection';
import type { ApToolCallProps, ITreeNode, TSpan } from './ApToolCall.types';

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

const SectionsContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ expanded }) => ({
  marginLeft: token.Spacing.SpacingS,
  paddingLeft: token.Spacing.SpacingS,
  borderLeft: `${token.Border.BorderThickS} solid var(--color-border)`,
  maxHeight: expanded ? '500px' : '0',
  overflow: 'hidden',
  transition: 'max-height 0.2s ease',
  maxWidth: `calc(100% - ${token.Spacing.SpacingBase})`,
  boxSizing: 'border-box',
  '&:focus-visible': {
    outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
    outlineOffset: '-1px',
  },
}));

const ExecutionItemsContainer = styled('div')({
  marginTop: token.Spacing.SpacingMicro,
  paddingLeft: token.Spacing.SpacingMicro,
});

const ExecutionItemContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingS,
  marginBottom: token.Spacing.SpacingS,
});

const ExecutionIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  width: token.Spacing.SpacingM,
  height: token.Spacing.SpacingM,
});

const ExecutionName = styled('span')({
  display: 'inline-block',
  flex: 1,
});

interface ExecutionItemContentProps {
  child: ITreeNode<TSpan>;
}

const ExecutionItem: React.FC<ExecutionItemContentProps> = ({ child }) => {
  // Placeholder for icon - in real implementation, would use getSpanIconSvg
  const icon = useMemo(() => {
    return <ExecutionIcon>{/* Icon placeholder */}</ExecutionIcon>;
  }, [child.data]);

  return (
    <ExecutionItemContainer>
      {icon}
      <ExecutionName>{child.name}</ExecutionName>
    </ExecutionItemContainer>
  );
};

const ExecutionItemContent = React.memo(ExecutionItem);

/**
 * ApToolCall displays tool call execution information with expandable sections
 * showing input, output, execution steps, and errors.
 */
export const ApToolCall = React.forwardRef<HTMLDivElement, ApToolCallProps>((props, ref) => {
  const { span, toolName, input, output, isError, startTime, endTime } = props;
  const { _ } = useLingui();
  const [toolCallExpanded, setToolCallExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    input: false,
    execution: false,
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
      return _(msg({ id: 'tool-call.running', message: `Running ${toolCallName}...` }));
    }

    // Calculate duration
    const endTimeStamp = endTime || span?.data?.endTime;
    const startTimeStamp = startTime || span?.data?.startTime;
    const duration =
      endTimeStamp && startTimeStamp
        ? (new Date(endTimeStamp).getTime() - new Date(startTimeStamp).getTime()) / 1000
        : 0;

    return _(
      msg({ id: 'tool-call.ran', message: `Ran ${toolCallName} (${duration.toFixed(2)}s)` })
    );
  }, [getStatus, toolName, span, startTime, endTime, _]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setToolCallExpanded(!toolCallExpanded);
      }
    },
    [toolCallExpanded]
  );

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

      <SectionsContainer expanded={toolCallExpanded}>
        {(input || (span && getAttributes(span.data).arguments)) && (
          <ToolCallSection
            type="input"
            title={_(msg({ id: 'tool-call.input', message: 'Input' }))}
            isExpanded={expandedSections['input']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                ['input']: !prev['input'],
              }))
            }
            data={input || (span ? getAttributes(span.data).arguments : undefined)}
          />
        )}
        {span?.children?.length ? (
          <ToolCallSection
            type="execution"
            title={_(msg({ id: 'tool-call.execution', message: 'Execution' }))}
            isExpanded={expandedSections['execution']}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                ['execution']: !prev['execution'],
              }))
            }
          >
            <ExecutionItemsContainer>
              {span.children?.map((child) => (
                <ExecutionItemContent key={child.key} child={child} />
              ))}
            </ExecutionItemsContainer>
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
                ['escalation']: !prev['escalation'],
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
                ['errors']: !prev['errors'],
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
                ['output']: !prev['output'],
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
