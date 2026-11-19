import { Button, cn } from '@uipath/apollo-wind';
import { FileText } from 'lucide-react';
import type React from 'react';
import { CITATION_BUTTON_CLASS } from './sentenceStyles';
import type { OpenCitation, SentenceCitation } from './sentenceTypes';

/** A citation's strings. */
export interface CitationLabels {
  /** A citation's action, e.g. "Open source, page 3". */
  openCitation: (page: number) => string;
  /** A shown citation's page, e.g. "Page 3". */
  citationPage: (page: number) => string;
}

export interface CitationButtonProps {
  citation: SentenceCitation;
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
    aria-label={labels.openCitation(citation.page)}
    className={cn(CITATION_BUTTON_CLASS, className)}
    data-rule-action="citation"
    data-testid={dataTestId}
    onClick={() => onOpen(citation)}
  >
    <FileText aria-hidden />
    {selected && <span aria-hidden>{labels.citationPage(citation.page)}</span>}
  </Button>
);

export interface CitationButtonsProps extends Omit<CitationButtonProps, 'citation' | 'dataTestId'> {
  citations: readonly SentenceCitation[];
  dataTestId: string;
}

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
      dataTestId={index === 0 ? dataTestId : `${dataTestId}-${index}`}
      {...props}
    />
  ));
