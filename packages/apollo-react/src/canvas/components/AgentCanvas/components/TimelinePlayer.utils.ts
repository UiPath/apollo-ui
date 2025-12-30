import { DateTime } from 'luxon';
import type { IRawSpan } from '@uipath/portal-shell-react';

const DEFAULT_SPAN_DURATION_MS = 1000;
const MINIMUM_VISIBLE_DURATION = 0.01;

const TIMELINE_PLAYER_HEIGHT = 96;

export interface NormalizedSpan extends IRawSpan {
  normalizedStart: number;
  normalizedDuration: number;
  depth: number;
}

export const shouldRenderTimelinePlayer = (
  enableTimelinePlayer: boolean | undefined,
  durationMs: number,
  normalizedSpans: NormalizedSpan[]
): boolean => {
  if (!enableTimelinePlayer || durationMs === 0 || normalizedSpans.length === 0) {
    return false;
  }
  return true;
};

export function calculateSpanDepth(spans: IRawSpan[]): Map<string, number> {
  const depthMap = new Map<string, number>();
  const parentMap = new Map<string, string>();

  // Build parent-child relationships
  for (const span of spans) {
    if (span.ParentId) {
      parentMap.set(span.Id, span.ParentId);
    }
  }

  // Calculate depth for each span
  const getDepth = (spanId: string): number => {
    if (depthMap.has(spanId)) {
      return depthMap.get(spanId) || 0;
    }

    const parentId = parentMap.get(spanId);
    if (!parentId) {
      depthMap.set(spanId, 0);
      return 0;
    }

    const depth = getDepth(parentId) + 1;
    depthMap.set(spanId, depth);
    return depth;
  };

  for (const span of spans) {
    getDepth(span.Id);
  }

  return depthMap;
}

export function normalizeSpans(spans: IRawSpan[]): NormalizedSpan[] {
  const depthMap = calculateSpanDepth(spans);

  const getTime = (s: string | null) => {
    if (!s) {
      return null;
    }

    const luxonDate = DateTime.fromISO(s);
    if (luxonDate.isValid) {
      return luxonDate.toMillis();
    }
    return null;
  };

  // Calculate end times, using UpdatedAt or current time for incomplete spans
  const times = spans.map((s) => {
    const start = getTime(s.StartTime);
    let end = getTime(s.EndTime);

    // Handle incomplete spans (EndTime is null)
    if (!end && start) {
      if (s.UpdatedAt) {
        end = getTime(s.UpdatedAt);
      } else {
        end = Date.now();
      }
    }

    return {
      start: start || 0,
      end: end || (start || 0) + DEFAULT_SPAN_DURATION_MS, // Default 1 second duration if all else fails
    };
  });

  const validTimes = times.filter((t) => t.start > 0 && t.end > 0);
  if (validTimes.length === 0) {
    return spans.map((span) => ({
      ...span,
      normalizedStart: 0,
      normalizedDuration: 0,
      depth: depthMap.get(span.Id) || 0,
    }));
  }

  const minStart = Math.min(...validTimes.map((t) => t.start));
  const maxEnd = Math.max(...validTimes.map((t) => t.end));
  const duration = maxEnd - minStart;

  if (duration === 0) {
    return spans.map((span) => ({
      ...span,
      normalizedStart: 0,
      normalizedDuration: 1,
      depth: depthMap.get(span.Id) || 0,
    }));
  }

  return spans.map((span, index) => {
    const time = times[index] as NonNullable<(typeof times)[number]>;
    const start = time.start;
    const end = time.end;
    const spanDuration = end - start;

    return {
      ...span,
      normalizedStart: (start - minStart) / duration,
      normalizedDuration: Math.max(spanDuration / duration, MINIMUM_VISIBLE_DURATION), // Minimum visible width
      depth: depthMap.get(span.Id) || 0,
    };
  });
}

/**
 * Finds the first agentRun span
 */
export function findAgentRunSpan(spans: IRawSpan[]): IRawSpan | undefined {
  return spans.find((span) => span.SpanType === 'agentRun');
}

/**
 * Finds all agentRun spans
 */
export function findAllAgentRunSpans(spans: IRawSpan[]): IRawSpan[] {
  return spans.filter((span) => span.SpanType === 'agentRun');
}

/**
 * Filters spans to only include children of agentRun spans
 */
export function filterChildSpans(spans: IRawSpan[], agentSpans: IRawSpan[]): IRawSpan[] {
  const agentIds = agentSpans.map((s) => s.Id);
  return spans.filter((span) => agentIds.includes(span.ParentId ?? ''));
}

/**
 * Calculates duration in milliseconds from a parent span
 */
export function calculateDurationMs(parentSpan: IRawSpan | undefined): number {
  const start = parentSpan?.StartTime ?? 0;
  const end = parentSpan?.EndTime ?? parentSpan?.UpdatedAt ?? 0;
  if (start && end) {
    return DateTime.fromISO(end).toMillis() - DateTime.fromISO(start).toMillis();
  }
  return 0;
}

/**
 * Determines if the timeline player will render and returns its height
 */
export const calculateTimelineHeight = (
  enableTimelinePlayer: boolean | undefined,
  spans: IRawSpan[]
): number => {
  const parentSpan = findAgentRunSpan(spans);
  const agentSpans = findAllAgentRunSpans(spans);
  const filteredSpans = filterChildSpans(spans, agentSpans);
  const normalizedSpans = normalizeSpans(filteredSpans);
  const durationMs = calculateDurationMs(parentSpan);

  if (!shouldRenderTimelinePlayer(enableTimelinePlayer, durationMs, normalizedSpans)) {
    return 0;
  }

  return TIMELINE_PLAYER_HEIGHT;
};
