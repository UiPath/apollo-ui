export interface ProcessItem {
  id: string;
  label: string;
}

export interface StageNodeData extends Record<string, unknown> {
  title: string;
  processes: ProcessItem[][];
  addProcessLabel?: string;
}
