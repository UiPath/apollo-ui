import type { CentralizedGuardrailParameterRow } from '../centralized-types';
import { CentralizedDetailField } from './centralized-detail-field';

export interface CentralizedGuardrailParametersProps {
  rows: CentralizedGuardrailParameterRow[];
  /** Heading above the block; omitted when the caller supplies its own. */
  heading?: string;
}

/** Placeholder for a key the policy selected but gave no threshold. */
const UNSET_THRESHOLD = '—';

/**
 * A centralized guardrail's configuration as text, not disabled inputs: the MetadataForm
 * editors have no read-only mode, and a disabled input cannot be focused or copied.
 */
export function CentralizedGuardrailParameters({
  rows,
  heading,
}: CentralizedGuardrailParametersProps) {
  if (rows.length === 0) return null;

  return (
    <div data-slot="centralized-guardrail-parameters" className="space-y-2">
      {heading !== undefined && <h4 className="text-sm font-medium">{heading}</h4>}
      <dl className="space-y-3">
        {rows.map((row) =>
          row.kind === 'value' ? (
            <CentralizedDetailField key={row.id} label={row.label}>
              {row.value}
            </CentralizedDetailField>
          ) : (
            <CentralizedDetailField key={row.id} label={row.label} className="space-y-1">
              <ul className="divide-y rounded-md border">
                {row.thresholds.map((threshold) => (
                  <li
                    key={threshold.key}
                    className="flex items-center justify-between gap-3 px-2 py-1.5"
                  >
                    <span className="min-w-0 truncate text-foreground">{threshold.label}</span>
                    <span className="shrink-0 tabular-nums">
                      {threshold.value ?? UNSET_THRESHOLD}
                    </span>
                  </li>
                ))}
              </ul>
            </CentralizedDetailField>
          )
        )}
      </dl>
    </div>
  );
}
