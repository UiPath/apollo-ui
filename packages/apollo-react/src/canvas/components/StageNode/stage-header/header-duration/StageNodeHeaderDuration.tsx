import { memo } from 'react';
import { useSafeLingui } from '../../../../../i18n';
import { CanvasTooltip } from '../../../CanvasTooltip';
import {
  formatDurationMs,
  formatExactDurationMs,
  hasHiddenDurationParts,
} from '../../formatDuration';

interface StageNodeHeaderDurationInnerProps {
  id: string;
  durationMs?: number;
  durationLabel?: string;
  duration?: string;
}

const StageNodeHeaderDurationInner = ({
  id,
  durationMs,
  durationLabel,
  duration,
}: StageNodeHeaderDurationInnerProps) => {
  const { locale } = useSafeLingui();

  // `durationMs` wins: only the number can be shortened to its largest units. A legacy
  // pre-formatted string is rendered as the consumer supplied it.
  const formattedStageDuration =
    durationMs !== undefined ? formatDurationMs(durationMs, locale) : duration;
  // The label is the consumer's word, already localised — Apollo only decides that it sits in front
  // of the value. Joined with a plain space so the label carries its own punctuation ("Duration:").
  const stageDurationLabel = durationLabel;
  const stageDuration =
    formattedStageDuration && stageDurationLabel
      ? `${stageDurationLabel} ${formattedStageDuration}`
      : formattedStageDuration;
  if (stageDuration == null) {
    return null;
  }

  const exactStageDuration =
    durationMs != null && hasHiddenDurationParts(durationMs)
      ? formatExactDurationMs(durationMs, locale)
      : undefined;

  return (
    <CanvasTooltip content={exactStageDuration} placement="top">
      <span
        className="flex min-h-8 items-center text-xs text-foreground-muted"
        data-testid={`stage-duration-${id}`}
      >
        {stageDuration}
      </span>
    </CanvasTooltip>
  );
};

export const StageNodeHeaderDuration = memo(StageNodeHeaderDurationInner);
