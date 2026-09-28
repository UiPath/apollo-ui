export type CanvasMode = 'design' | 'debug' | 'evaluate';

export interface DebugControls {
  isInitiated?: boolean;
  status?: string;
  onStep?: () => void;
  onContinue?: () => void;
  onRestart?: () => void;
  onStop?: () => void;
}
