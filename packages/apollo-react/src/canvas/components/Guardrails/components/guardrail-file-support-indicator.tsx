import { cn } from '@uipath/apollo-wind';
import { FileText, Paperclip } from 'lucide-react';
import type { GuardrailFileFormat, GuardrailFileSupport } from '../builder-types';
import {
  formatGuardrailFormMessage,
  type GuardrailFileSupportLabelOverrides,
  type GuardrailFileSupportLabels,
  useGuardrailFileSupportLabels,
} from '../i18n';

export interface GuardrailFileSupportIndicatorProps {
  /**
   * What the host says this validator reads. `undefined` renders nothing: a host that has not
   * adopted the field, or a BYO definition, has said nothing about files, and guessing either
   * way would be worse than staying quiet.
   */
  fileSupport?: GuardrailFileSupport;
  /** Per-string overrides; `formats` may name a single file kind without restating the rest. */
  labels?: GuardrailFileSupportLabelOverrides;
  className?: string;
}

/** Display order of the format names, independent of the order the host listed them in. */
const FORMAT_ORDER: readonly GuardrailFileFormat[] = ['Text', 'Pdf', 'Image', 'Office', 'Html'];

function formatNames(
  formats: readonly GuardrailFileFormat[],
  labels: GuardrailFileSupportLabels
): string[] {
  const present = new Set(formats);
  return FORMAT_ORDER.filter((format) => present.has(format)).map(
    (format) => labels.formats[format]
  );
}

/**
 * Says whether a guardrail validator reads the files attached to a run, and which kinds.
 *
 * Purely a function of the `fileSupport` it is handed. There is no per-validator branching
 * anywhere in here, by design. The host derives it from the feature flags that switch file
 * support on, so the card and the run cannot disagree, and a validator that gains coverage is a
 * flag flip rather than a change to this component.
 *
 * Three states, all data-driven:
 * - reads files: the kinds
 * - reads none: why, when the host gave a reason it can name
 * - nothing known: renders `null`
 */
export function GuardrailFileSupportIndicator({
  fileSupport,
  labels: labelOverrides,
  className,
}: GuardrailFileSupportIndicatorProps) {
  const labels = useGuardrailFileSupportLabels(labelOverrides);

  if (fileSupport === undefined) return null;

  const shell = (icon: React.ReactNode, text: string) => (
    <div
      data-slot="guardrail-file-support"
      className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
    >
      {icon}
      <span>{text}</span>
    </div>
  );

  if (!fileSupport.supported) {
    const reason =
      fileSupport.unavailableReason === 'AutomationSuite'
        ? labels.unavailableOnAutomationSuite
        : labels.notSupported;
    return shell(<FileText className="size-3.5 shrink-0" aria-hidden />, reason);
  }

  const names = formatNames(fileSupport.formats, labels);

  // Supported with nothing to name: still worth saying files are read, since the alternative
  // is a card that looks identical to one that reads none.
  const text =
    names.length === 0
      ? labels.supported
      : formatGuardrailFormMessage(labels.supportedFormats, {
          formats: names.join(labels.formatSeparator),
        });

  return shell(<Paperclip className="size-3.5 shrink-0" aria-hidden />, text);
}
