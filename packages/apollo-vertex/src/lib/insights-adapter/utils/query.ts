import type { InitClientReturn } from "@ts-rest/core";
import type { DataQueryResponse } from "@/lib/charts-core";
import type { insightsContract } from "../contract";
import type { InsightsQueryRequest } from "../schemas/query-schema";
import { throwInsightsError } from "./throw-error";

export type InsightsClient = InitClientReturn<
  typeof insightsContract,
  { baseUrl: string }
>;

type QueryResponse =
  | { status: 200; body: DataQueryResponse }
  | { status: 400; body: { error: string } };

export async function insightsQuery(
  client: InsightsClient,
  sourceType: string,
  body: InsightsQueryRequest,
  errorMessage: string,
): Promise<DataQueryResponse> {
  // oxlint's tsgolint can't resolve ts-rest's InitClientReturn generic, so it
  // sees client.query as `error`-typed; the cast restores the real shape.
  // oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-type-assertion
  const result = (await client.query({
    params: { sourceType },
    body,
  })) as QueryResponse;

  if (result.status !== 200) {
    throwInsightsError(result, errorMessage);
  }

  return result.body;
}
