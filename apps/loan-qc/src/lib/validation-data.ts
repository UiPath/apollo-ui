import type { ValidationItem, Document, DocumentHighlight } from './types';

// Document highlights based on Figma design
const doc1Highlights: DocumentHighlight[] = [
  {
    id: 'hl-1',
    documentId: 'doc-1',
    boundingBox: { x: 13.6, y: 13.1, width: 18.8, height: 2.15 },
    color: 'rgba(36, 175, 191, 0.3)',
    label: 'Grantor Name',
  },
];

const doc2Highlights: DocumentHighlight[] = [
  {
    id: 'hl-2',
    documentId: 'doc-2',
    boundingBox: { x: 20.3, y: 15.6, width: 19.3, height: 4.85 },
    color: 'rgba(36, 175, 191, 0.3)',
    label: 'Borrower Name',
  },
];

export const mockValidationItems: ValidationItem[] = [
  {
    id: '1',
    title: "Grantor's name matches Credit Memo",
    aiEvaluation: { status: 'yes', confidence: 0.95 },
    humanEvaluation: null,
    details: {
      agentReasoning:
        'Source (Grantor) name matches target (Borrower Name) after normalization.',
      identifiedFields: [
        {
          label: 'Name',
          sourceValue: 'Tilbrae Logistics Group LLC',
          targetValue: 'TILBRAE LOGISTICS GROUP LLC',
          sourceLabel: 'Grantor',
          targetLabel: 'Borrower Name',
        },
      ],
    },
    comments: [],
    documentHighlights: [...doc1Highlights, ...doc2Highlights],
  },
  {
    id: '2',
    title: 'Loan amount does not exceed approved amount',
    aiEvaluation: { status: 'yes', confidence: 0.98 },
    humanEvaluation: null,
    details: {
      agentReasoning:
        'Loan amount is within the approved limit.',
      identifiedFields: [
        { label: 'Loan Amount', value: '$500,000' },
        { label: 'Approved Limit', value: '$750,000' },
      ],
    },
    comments: [],
  },
  {
    id: '3',
    title: "Lender's address matches Credit Memo",
    aiEvaluation: { status: 'no', confidence: 0.87 },
    humanEvaluation: null,
    details: {
      agentReasoning:
        'Address mismatch detected. Source address differs from target.',
      identifiedFields: [
        {
          label: 'Address',
          sourceValue: '123 Main St, New York, NY 10001',
          targetValue: '456 Oak Ave, Brooklyn, NY 11201',
          sourceLabel: 'Agreement',
          targetLabel: 'Credit Memo',
        },
      ],
    },
    comments: [],
  },
  {
    id: '4',
    title: "Borrower's name for signature matches ID",
    aiEvaluation: { status: 'inconclusive', confidence: 0.42 },
    humanEvaluation: 'needs-review',
    details: {
      agentReasoning:
        'Unable to conclusively match signature name with ID. Manual review required.',
      identifiedFields: [
        {
          label: 'Name',
          sourceValue: 'J. Smith',
          targetValue: 'John P. Smith',
          sourceLabel: 'Signature',
          targetLabel: 'ID',
        },
      ],
    },
    comments: [],
  },
  {
    id: '5',
    title: 'Borrower information matches Credit Memo',
    aiEvaluation: { status: 'yes', confidence: 0.92 },
    humanEvaluation: null,
    details: {
      agentReasoning:
        'All borrower identifying information fields match between the application and Credit Memo.',
      identifiedFields: [
        {
          label: 'Borrower Name',
          sourceValue: 'TILBRAE LOGISTICS GROUP LLC',
          targetValue: 'TILBRAE LOGISTICS GROUP LLC',
          sourceLabel: 'Agreement',
          targetLabel: 'Credit Memo',
        },
        {
          label: 'Date of Birth',
          sourceValue: 'N/A (Business Entity)',
          targetValue: 'N/A (Business Entity)',
          sourceLabel: 'Agreement',
          targetLabel: 'Credit Memo',
        },
        {
          label: 'Address',
          sourceValue: '1234 Commerce Drive, Suite 200, Dallas, TX 75201',
          targetValue: '1234 Commerce Drive, Suite 200, Dallas, TX 75201',
          sourceLabel: 'Agreement',
          targetLabel: 'Credit Memo',
        },
        {
          label: 'SSN/TIN',
          sourceValue: '**-***4567',
          targetValue: '**-***4567',
          sourceLabel: 'Agreement',
          targetLabel: 'Credit Memo',
        },
      ],
    },
    comments: [],
  },
];

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Agreement to provide insurance',
    imageUrl: '/documents/agreement-to-provide-insurance.png',
    type: 'agreement',
  },
  {
    id: 'doc-2',
    name: 'Credit memo',
    imageUrl: '/documents/credit-approval-memo.png',
    type: 'credit-memo',
  },
];
