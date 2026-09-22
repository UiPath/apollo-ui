import type { InitClientReturn } from "@ts-rest/core";
import type { dataFabricContract } from "../contract";
import type {
  DataFabricQueryRequest,
  DataFabricQueryResponse,
} from "../schemas/query-schema";
import { throwDataFabricError } from "./throw-error";

export type DataFabricClient = InitClientReturn<
  typeof dataFabricContract,
  { baseUrl: string }
>;

type QueryResponse =
  | { status: 200; body: DataFabricQueryResponse }
  | { status: 400; body: { error?: { message?: string } } };

export async function dataFabricQuery(
  client: DataFabricClient,
  entityName: string,
  body: DataFabricQueryRequest,
  errorMessage: string,
): Promise<DataFabricQueryResponse> {
  // oxlint's tsgolint can't resolve ts-rest's InitClientReturn generic, so it
  // sees client.query as `error`-typed; the cast restores the real shape.
  // oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-type-assertion
  const result = (await client.query({
    params: { entityName },
    body,
  })) as QueryResponse;

  if (result.status !== 200) {
    throwDataFabricError(result, errorMessage);
  }

  return result.body;
}
