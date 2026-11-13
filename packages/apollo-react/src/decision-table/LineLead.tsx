import { Check, X } from 'lucide-react';
import type React from 'react';
import { LINE_BULLET_CLASS, LINE_VERDICT_CLASS } from './sentenceStyles';

export interface LineLeadLabels {
  /** A condition's run verdict as read aloud, e.g. "Matched" or "Not matched". */
  conditionVerdict: (matched: boolean) => string;
}

export interface LineLeadProps {
  matched: boolean | undefined;
  labels: LineLeadLabels;
}

/** The bullet of a condition, or whether its run matched it. */
export const LineLead: React.FC<LineLeadProps> = ({ matched, labels }) => {
  if (matched === undefined) return <span aria-hidden className={LINE_BULLET_CLASS} />;
  const Verdict = matched ? Check : X;
  return (
    <>
      <Verdict
        aria-hidden
        data-verdict={matched ? 'matched' : 'unmatched'}
        className={LINE_VERDICT_CLASS[matched ? 'matched' : 'unmatched']}
      />
      <span className="sr-only">{labels.conditionVerdict(matched)}</span>
    </>
  );
};
