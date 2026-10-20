export type ResolverFailure =
  | {
      reason: "unknown_field_in_entity";
      field: string;
      entity: string;
    }
  | {
      reason: "unknown_field_in_joined";
      field: string;
    }
  | {
      reason: "wrong_dimension_type_in_entity";
      field: string;
      entity: string;
      actual: string;
      expected: string;
    }
  | {
      reason: "wrong_dimension_type_in_joined";
      field: string;
      actual: string;
      expected: string;
    }
  | {
      reason: "wrong_metric_type_in_entity";
      field: string;
      entity: string;
      actual: string;
      aggregation: string;
    }
  | {
      reason: "wrong_metric_type_in_joined";
      field: string;
      actual: string;
      aggregation: string;
    }
  | {
      reason: "missing_metric_field";
      aggregation: string;
    }
  | {
      reason: "no_countable_in_entity";
      entity: string;
    }
  | {
      reason: "no_countable_in_joined";
      primary: string;
    };

export type ToolResolutionFailure =
  | { reason: "unknown_entity"; entity: string }
  | { reason: "table_no_valid_fields"; entity: string; fields: string }
  | { reason: "multi_line_too_few_metrics" }
  | ResolverFailure;

export type ResolverResult<T> =
  | { ok: true; value: T }
  | ({ ok: false } & ResolverFailure);

export const ok = <T>(value: T): ResolverResult<T> => ({ ok: true, value });

export const fail = <T>(failure: ResolverFailure): ResolverResult<T> => ({
  ok: false,
  ...failure,
});
