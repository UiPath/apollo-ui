import { Button, cn } from '@uipath/apollo-wind';
import { FileText } from 'lucide-react';
import type React from 'react';
import { CITATION_BUTTON_CLASS } from './sentenceStyles';
import type { OpenCitation, SentenceCitation } from './sentenceTypes';

/** What a citation is the source of: a rule by its 1-based position, a named decision, or the table's own decision. */
export type CitationOwner =
  | { kind: 'rule'; position: number }
  | { kind: 'decision'; name: string }
  | { kind: 'table' };

/** A citation's strings. */
export interface CitationLabels {
  /** A citation's action, e.g. "Open source 2 of rule 4, page 3"; numbered only among its owner's citations on the same page. */
  openCitation: (owner: CitationOwner, page: number, index: number | null) => string;
  /** A shown citation's page, e.g. "Page 3". */
  citationPage: (page: number) => string;
}

export interface CitationButtonProps {
  citation: SentenceCitation;
  owner: CitationOwner;
  /** Its 1-based place among its owner's citations on the same page, or null when it is the only one there. */
  index: number | null;
  onOpen: OpenCitation;
  /** Its decision or rule is selected, so its page shows. */
  selected: boolean;
  /** -1 while a roving stop holds the tab order. */
  tabIndex: 0 | -1;
  /** Where it sits, and when it shows. */
  className: string;
  labels: CitationLabels;
  dataTestId: string;
}

/** An open-document button for where a decision or rule was read from; its page shows once selected. */
export const CitationButton: React.FC<CitationButtonProps> = ({
  citation,
  owner,
  index,
  onOpen,
  selected,
  tabIndex,
  className,
  labels,
  dataTestId,
}) => (
  <Button
    variant="ghost"
    size="3xs"
    tabIndex={tabIndex}
    aria-label={labels.openCitation(owner, citation.page, index)}
    className={cn(CITATION_BUTTON_CLASS, className)}
    data-rule-action="citation"
    data-testid={dataTestId}
    onClick={() => onOpen(citation)}
  >
    <FileText aria-hidden />
    {selected && <span aria-hidden>{labels.citationPage(citation.page)}</span>}
  </Button>
);

export interface CitationButtonsProps
  extends Omit<CitationButtonProps, 'citation' | 'index' | 'dataTestId'> {
  citations: readonly SentenceCitation[];
  dataTestId: string;
}

const indexOf = (citations: readonly SentenceCitation[], at: number): number | null => {
  const page = citations[at]?.page;
  const shared = citations.filter((citation) => citation.page === page).length;
  return shared > 1
    ? citations.slice(0, at + 1).filter((citation) => citation.page === page).length
    : null;
};

/** One citation button per source, the first keeping the given test id. */
export const CitationButtons: React.FC<CitationButtonsProps> = ({
  citations,
  dataTestId,
  ...props
}) =>
  citations.map((citation, index) => (
    <CitationButton
      key={`${citation.kind}-${citation.page}-${index}`}
      citation={citation}
      index={indexOf(citations, index)}
      dataTestId={index === 0 ? dataTestId : `${dataTestId}-${index}`}
      {...props}
    />
  ));
