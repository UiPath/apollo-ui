import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  DataFabricQueryRequestSchema,
  DataFabricQueryResponseSchema,
} from "./schemas/query-schema";

const c = initContract();

const queryErrorResponse = z.object({
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
    })
    .optional(),
});

export const dataFabricContract = c.router(
  {
    query: {
      method: "POST",
      path: "/v2/EntityService/:entityName/query",
      responses: {
        200: DataFabricQueryResponseSchema,
        400: queryErrorResponse,
      },
      pathParams: z.object({
        entityName: z.string(),
      }),
      body: DataFabricQueryRequestSchema,
    },
  },
  {
    strictStatusCodes: true,
  },
);
