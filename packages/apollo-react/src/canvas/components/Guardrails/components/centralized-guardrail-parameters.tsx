import type { CentralizedGuardrailParameterRow } from '../centralized-types';

export interface CentralizedGuardrailParametersProps {
  rows: CentralizedGuardrailParameterRow[];
  /** Heading above the block; omitted when the caller supplies its own. */
  heading?: string;
}

/** Placeholder for a key the policy selected but gave no threshold. */
const UNSET_THRESHOLD = '—';

/**
 * A centralized guardrail's configuration, as a description list.
 *
 * Deliberately not the family's parameter editors in a read-only mode. Those are the
 * MetadataForm stack, which has no read-only mode to put them in, and a centralized
 * guardrail's values arrive as untyped wire data rather than as
 * `GuardrailValidatorParameter`s, so feeding them through would mean inventing a lossy
 * mapping for a surface that never edits. Disabled inputs, which is how one product renders
 * this today, are also worse than text here: they cannot be focused, so their content is not
 * selectable, not copyable and skipped by a screen reader's browse cursor.
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
            <div key={row.id} className="space-y-0.5">
              <dt className="text-xs font-medium text-foreground">{row.label}</dt>
              <dd className="text-sm text-muted-foreground">{row.value}</dd>
            </div>
          ) : (
            <div key={row.id} className="space-y-1">
              <dt className="text-xs font-medium text-foreground">{row.label}</dt>
              <dd>
                <ul className="divide-y rounded-md border">
                  {row.thresholds.map((threshold) => (
                    <li
                      key={threshold.key}
                      className="flex items-center justify-between gap-3 px-2 py-1.5 text-sm"
                    >
                      <span className="min-w-0 truncate">{threshold.label}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {threshold.value ?? UNSET_THRESHOLD}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )
        )}
      </dl>
    </div>
  );
}
