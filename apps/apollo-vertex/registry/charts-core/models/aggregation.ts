export type Aggregation =
  | { kind: "count"; field?: string }
  | { kind: "sum"; field: string }
  | { kind: "avg"; field: string }
  | { kind: "min"; field: string }
  | { kind: "max"; field: string };

export type AggregationKind = Aggregation["kind"];

export const Aggregation = {
  count: (field?: string): Aggregation => ({ kind: "count", field }),
  sum: (field: string): Aggregation => ({ kind: "sum", field }),
  avg: (field: string): Aggregation => ({ kind: "avg", field }),
  min: (field: string): Aggregation => ({ kind: "min", field }),
  max: (field: string): Aggregation => ({ kind: "max", field }),
} as const;
