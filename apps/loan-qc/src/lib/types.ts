export type AIEvaluationStatus = 'yes' | 'no' | 'inconclusive' | 'pending';
export type HumanEvaluationStatus = 'yes' | 'no' | 'na' | 'needs-review' | null;

export interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  author?: string;
}

export interface IdentifiedField {
  label: string;
  value?: string; // Single value (for simple comparisons)
  sourceValue?: string; // Value from source document
  targetValue?: string; // Value from target document
  sourceLabel?: string; // Optional custom label for source (defaults to "Source")
  targetLabel?: string; // Optional custom label for target (defaults to "Target")
}

export interface ValidationItem {
  id: string;
  title: string;
  aiEvaluation: {
    status: AIEvaluationStatus;
    confidence?: number;
  };
  humanEvaluation: HumanEvaluationStatus;
  details: {
    agentReasoning: string;
    identifiedFields?: IdentifiedField[];
    // Legacy fields for backward compatibility
    sourceText?: string;
    targetText?: string;
  };
  comments: Comment[];
  documentHighlights?: DocumentHighlight[];
}

export interface DocumentHighlight {
  id: string;
  documentId: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  color: string;
  label?: string; // Tooltip label to display on hover
}

export interface Document {
  id: string;
  name: string;
  imageUrl: string;
  type: 'agreement' | 'credit-memo';
}

export type ViewMode = 'split' | 'immersive-left' | 'immersive-right';
