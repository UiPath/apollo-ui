import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { FontVariantToken, Spacing } from "@uipath/apollo-core";
import { ApIconButton, ApTypography, type IRawSpan } from "@uipath/portal-shell-react";
import { Column, Row, Icons } from "@uipath/uix/core";

const PERCENTAGE_MULTIPLIER = 100;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const TIME_PADDING_DIGITS = 2;
const TIME_PADDING_CHAR = "0";
const DEFAULT_SPAN_DURATION_MS = 1000;
const MINIMUM_VISIBLE_DURATION = 0.01;
const SPAN_Z_INDEX_INACTIVE = 2;
const TIMELINE_BAR_HEIGHT = 30;
const TIMELINE_TRACK_BAR_HEIGHT = 4;
const TIMELINE_SPAN_HEIGHT = 5;
const SPEED_LEVEL_1 = 1;
const SPEED_LEVEL_2 = 2;
const SPEED_LEVEL_3 = 3;
const SPEED_LEVEL_4 = 5;

interface NormalizedSpan extends IRawSpan {
  normalizedStart: number;
  normalizedDuration: number;
  depth: number;
}

const TimelineBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div
    ref={ref}
    {...props}
    style={{
      position: "relative",
      height: `${TIMELINE_BAR_HEIGHT}px`,
      flex: 1,
      cursor: "pointer",
      ...props.style,
    }}
  />
));

const SpanBlock: React.FC<{
  left: number;
  width: number;
  isActive?: boolean;
  isPlayed?: boolean;
  depth?: number;
  title?: string;
  status?: number;
  progressPosition?: number; // Current progress position as percentage (0-100)
}> = ({ left, width, isActive = false, isPlayed = false, depth = 0, title, status, progressPosition = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = () => {
    if (status === 1) return "var(--color-success-icon, #038108)"; // Green for success
    if (status === 2) return "var(--color-error-icon, #CC3D45)"; // Red for error
    if (status === 3) return "var(--color-info-icon, #1976D2)"; // Blue for running
    return "var(--color-border-de-emp, #CFD8DD)"; // Default gray
  };

  const getBackgroundStyle = () => {
    // Only show status colors for spans that have been played
    if (isPlayed) {
      return { backgroundColor: getStatusColor() };
    }

    return { backgroundColor: "var(--color-border-de-emp, #CFD8DD)" };
  };

  const getBaseBackgroundStyle = () => {
    const hasPartialElements = isActive && getPartialElements() !== null;

    if (hasPartialElements) {
      // Transparent background allows partial blue/gray elements to show
      return { backgroundColor: "transparent" };
    } else {
      // Use standard background logic (status colors for played, gray for unplayed)
      return getBackgroundStyle();
    }
  };

  // For active spans, calculate partial coloring
  const getPartialElements = () => {
    if (!isActive || !status) {
      return null;
    }

    // Calculate the progress within this span
    const spanStart = left;
    const spanEnd = left + width;

    if (progressPosition <= spanStart) {
      // Progress hasn't reached this span yet - show all gray
      return null;
    } else if (progressPosition >= spanEnd) {
      // Proggress has passed this span completely - show all colored with actual status
      return null;
    } else {
      // Progress is within this span - show partial blue (running)
      const progressWithinSpan = ((progressPosition - spanStart) / width) * 100;

      return (
        <>
          {/* Blue running portion */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${progressWithinSpan}%`,
              height: "100%",
              backgroundColor: "var(--color-info-icon, #1976D2)",
              borderRadius: "var(--Small, 2px)",
              borderTopRightRadius: progressWithinSpan === 100 ? "var(--Small, 2px)" : 0,
              borderBottomRightRadius: progressWithinSpan === 100 ? "var(--Small, 2px)" : 0,
            }}
          />
          {/* Remaining gray portion */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: `${progressWithinSpan}%`,
              width: `${100 - progressWithinSpan}%`,
              height: "100%",
              backgroundColor: "var(--color-border-de-emp, #CFD8DD)",
              borderRadius: "var(--Small, 2px)",
              borderTopLeftRadius: progressWithinSpan === 0 ? "var(--Small, 2px)" : 0,
              borderBottomLeftRadius: progressWithinSpan === 0 ? "var(--Small, 2px)" : 0,
            }}
          />
        </>
      );
    }
  };

  return (
    <div
      title={title}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        top: `${(TIMELINE_BAR_HEIGHT - TIMELINE_SPAN_HEIGHT) / 2}px`,
        ...getBaseBackgroundStyle(),
        borderRadius: "var(--Small, 2px)",
        left: `${left}%`,
        width: `${width}%`,
        height: `${TIMELINE_SPAN_HEIGHT}px`,
        boxShadow: "inset 0 0 0 0px rgba(0, 0, 0, 0.1)",
        zIndex: SPAN_Z_INDEX_INACTIVE + depth + (isActive ? 1 : 0) + (isHovered ? 2 : 0),
        transition: "all 0.2s ease-in-out",
        transform: isActive || isHovered ? "scaleY(1.1)" : "scaleY(1)",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {getPartialElements()}
    </div>
  );
};

const TrackBar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: `${TIMELINE_BAR_HEIGHT / 2 - TIMELINE_TRACK_BAR_HEIGHT / 2}px`,
      backgroundColor: "var(--color-background, #FFFFFF)",
      height: `${TIMELINE_TRACK_BAR_HEIGHT}px`,
      borderRadius: "2px",
      width: "100%",
      zIndex: 0,
    }}
  />
);

const Scrubber: React.FC<{ left: number }> = ({ left }) => (
  <div
    style={{
      position: "absolute",
      top: `${(TIMELINE_BAR_HEIGHT - 35) / 2}px`,
      left: `${left}%`,
      transform: "translateX(-50%)",
      zIndex: 100,
      cursor: "ew-resize",
    }}
  >
    <Icons.TimelineProgressIcon w={10} h={10} color="#0067DF" />
  </div>
);

function calculateSpanDepth(spans: IRawSpan[]): Map<string, number> {
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

function normalizeSpans(spans: IRawSpan[]): NormalizedSpan[] {
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

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / MILLISECONDS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${seconds.toString().padStart(TIME_PADDING_DIGITS, TIME_PADDING_CHAR)}`;
}

export const TimelinePlayer: React.FC<{
  spans: IRawSpan[];
  enableTimelinePlayer?: boolean;
}> = ({ spans, enableTimelinePlayer = true }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(SPEED_LEVEL_1);
  const requestRef = useRef<number>();
  const timelineRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  // At this we identify all the spans where SpanType === "agentRun" and collect the first order children.
  // TODO: Build a map of agentRun -> child spans and allow the user to select the agent run to view.

  // TODO: Decide if we want to use the parentSpan or agentRun span as the parent.
  // const parentSpan = useMemo(() => spans.find((span) => span.ParentId === null), [spans]);

  const parentSpan = useMemo(() => spans.find((span) => span.SpanType === "agentRun"), [spans]);
  const agentSpans = useMemo(() => spans.filter((span) => span.SpanType === "agentRun"), [spans]);
  const filteredSpans = useMemo(
    () => spans.filter((span) => agentSpans.map((s) => s.Id).includes(span.ParentId ?? "")),
    [agentSpans, spans]
  );
  const normalizedSpans = useMemo(() => normalizeSpans(filteredSpans), [filteredSpans]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // The time scale is shown for the total duration of the trace (based on the parent span).
  const durationMs = useMemo(() => {
    const start = parentSpan?.StartTime ?? 0;
    const end = parentSpan?.EndTime ?? parentSpan?.UpdatedAt ?? 0;
    if (start && end) {
      return DateTime.fromISO(end).toMillis() - DateTime.fromISO(start).toMillis();
    }
    return 0;
  }, [parentSpan]);

  // Auto-set speed based on duration
  useEffect(() => {
    if (durationMs > 0) {
      const durationMinutes = durationMs / (1000 * 60);
      if (durationMinutes > 5) {
        setSpeedLevel(SPEED_LEVEL_4); // 5x for over 5 minutes
      } else if (durationMinutes > 3) {
        setSpeedLevel(SPEED_LEVEL_3); // 3x for over 3 minutes
      } else if (durationMinutes > 1) {
        setSpeedLevel(SPEED_LEVEL_2); // 2x for over 1 minute
      } else {
        setSpeedLevel(SPEED_LEVEL_1); // 1x for under 1 minute
      }
    }
  }, [durationMs]);

  const currentTimeMs = useMemo(() => progress * durationMs, [progress, durationMs]);
  const currentTimeFormatted = useMemo(() => formatTime(currentTimeMs), [currentTimeMs]);
  const totalTimeFormatted = useMemo(() => formatTime(durationMs), [durationMs]);

  const spanTimes = useMemo(() => {
    return filteredSpans.map((span) => ({
      id: span.Id,
      start: DateTime.fromISO(span.StartTime).toMillis(),
      end: DateTime.fromISO(span.EndTime).toMillis(),
    }));
  }, [filteredSpans]);

  const timelineInfo = useMemo(() => {
    const validTimes = spanTimes.filter((t) => t.start > 0 && t.end > 0);
    if (validTimes.length === 0) {
      return { minStart: 0, maxEnd: 0, duration: 0 };
    }

    const minStart = Math.min(...validTimes.map((t) => t.start));
    const maxEnd = Math.max(...validTimes.map((t) => t.end));
    const duration = maxEnd - minStart;

    return { minStart, maxEnd, duration };
  }, [spanTimes]);

  // Calculate which spans are currently active based on progress using the same timeline as visual positioning
  const activeSpanIds = useMemo((): string[] => {
    if (timelineInfo.duration === 0) return [];

    // Calculate current absolute time using the same timeline as visual spans
    const currentAbsoluteTime = timelineInfo.minStart + progress * timelineInfo.duration;

    return spanTimes.filter((span) => currentAbsoluteTime >= span.start && currentAbsoluteTime <= span.end).map((span) => span.id);
  }, [progress, spanTimes, timelineInfo]);

  // Calculate which spans have been played (timeline progress has reached their start time)
  const playedSpanIds = useMemo((): string[] => {
    if (timelineInfo.duration === 0) return [];

    // Calculate current absolute time using the same timeline as visual spans
    const currentAbsoluteTime = timelineInfo.minStart + progress * timelineInfo.duration;

    return spanTimes.filter((span) => currentAbsoluteTime > span.start).map((span) => span.id);
  }, [progress, spanTimes, timelineInfo]);

  // Get the most active (deepest) span
  const mostActiveSpan = useMemo((): NormalizedSpan | null => {
    if (activeSpanIds.length === 0) {
      return null;
    }
    // Find the active span with the highest depth (most specific/deepest in hierarchy)
    const activeSpans = normalizedSpans.filter((span) => activeSpanIds.includes(span.Id));
    return activeSpans.reduce((deepest, current) => (current.depth > deepest.depth ? current : deepest));
  }, [activeSpanIds, normalizedSpans]);

  const previousMostActiveSpanId = useRef<string | null>(null);
  useEffect(() => {
    if (!enableTimelinePlayer) return;
    const currentSpanId = mostActiveSpan?.Id || null;
    if (currentSpanId !== previousMostActiveSpanId.current) {
      const event = new CustomEvent("activeSpanChange", {
        detail: currentSpanId,
      });
      window.dispatchEvent(event);
      previousMostActiveSpanId.current = currentSpanId;
    }
  }, [mostActiveSpan?.Id, enableTimelinePlayer]);

  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    setProgress(newProgress);
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      setPlaying(false);
      handleTimelineClick(event);
    },
    [handleTimelineClick]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
      setProgress(newProgress);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const lastFrameTimeRef = useRef<number>();

  useEffect(() => {
    if (!playing || isDragging) return;

    const step = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Calculate progress increment based on speed and frame time
      const progressIncrement = (deltaTime * speedLevel * 2) / durationMs;

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setProgress((currentProgress) => {
          const newProgress = Math.min(currentProgress + progressIncrement, 1);
          if (newProgress >= 1) {
            setPlaying(false);
            lastFrameTimeRef.current = undefined;
            return 1;
          }
          return newProgress;
        });

        if (playing) {
          requestRef.current = requestAnimationFrame(step);
        }
      }
    };

    requestRef.current = requestAnimationFrame(step);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [playing, durationMs, isDragging, speedLevel]);

  useEffect(() => {
    // Reset frame timing when play starts or speed changes
    lastFrameTimeRef.current = undefined;
  }, [playing, speedLevel]);

  useEffect(() => {
    // Reset all state when parentSpan changes (new trace)
    setProgress(0);
    setPlaying(false);
    setIsDragging(false);
    lastFrameTimeRef.current = undefined;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
  }, [parentSpan?.Id]);

  const handlePlayPause = useCallback(() => {
    if (progress >= 1) {
      setProgress(0);
      setPlaying(true);
    } else {
      setPlaying(!playing);
    }
  }, [progress, playing]);

  const handleSpeedChange = useCallback(() => {
    // Cycle through speeds: 1x -> 2x -> 3x -> 5x -> 1x
    setSpeedLevel((prevLevel) => {
      if (prevLevel === SPEED_LEVEL_1) return SPEED_LEVEL_2;
      if (prevLevel === SPEED_LEVEL_2) return SPEED_LEVEL_3;
      if (prevLevel === SPEED_LEVEL_3) return SPEED_LEVEL_4;
      return SPEED_LEVEL_1;
    });
  }, []);

  if (!enableTimelinePlayer || durationMs === 0 || normalizedSpans.length === 0) {
    return null;
  }

  return (
    <Column
      py={Spacing.SpacingXs}
      px={Spacing.SpacingS}
      gap={Spacing.SpacingXs}
      minW={640}
      style={{
        backgroundColor: "var(--color-background-secondary)",
        color: "var(--color-foreground)",
        borderRadius: "8px",
        border: "1px solid var(--color-background-gray-light, #cfd8dd)",
        zIndex: 1000,
      }}
    >
      <Row align="center" gap={Spacing.SpacingXs}>
        <ApIconButton size="large" onClick={handlePlayPause}>
          {playing ? <Icons.TimelinePauseIcon w={24} h={24} /> : <Icons.TimelinePlayIcon w={24} h={24} />}
        </ApIconButton>

        <ApTypography>
          {currentTimeFormatted} / {totalTimeFormatted}
        </ApTypography>

        <ApTypography>{mostActiveSpan?.Name}</ApTypography>

        <div style={{ flex: 1 }} />

        <ApIconButton size="large" onClick={handleSpeedChange}>
          <ApTypography variant={FontVariantToken.fontSizeSBold}>{speedLevel}x</ApTypography>
        </ApIconButton>
      </Row>

      <Row align="center" style={{ marginLeft: "15px" }}>
        <TimelineBar ref={timelineRef} onClick={handleTimelineClick} onMouseDown={handleMouseDown}>
          <TrackBar />

          {normalizedSpans.map((span) => (
            <SpanBlock
              key={span.Id}
              left={span.normalizedStart * PERCENTAGE_MULTIPLIER}
              width={span.normalizedDuration * PERCENTAGE_MULTIPLIER}
              isActive={activeSpanIds.includes(span.Id)}
              isPlayed={playedSpanIds.includes(span.Id)}
              depth={span.depth}
              status={span.Status}
              progressPosition={progress * PERCENTAGE_MULTIPLIER}
              title={`${span.Name} (${formatTime(DateTime.fromISO(span.EndTime).toMillis() - DateTime.fromISO(span.StartTime).toMillis())})`}
            />
          ))}

          <Scrubber left={progress * PERCENTAGE_MULTIPLIER} />
        </TimelineBar>
      </Row>
    </Column>
  );
};
