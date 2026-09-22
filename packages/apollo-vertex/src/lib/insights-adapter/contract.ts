import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { DataQueryResponseSchema } from "@/lib/charts-core";
import { InsightsQueryRequestSchema } from "./schemas/query-schema";

const c = initContract();

export const insightsContract = c.router(
  {
    query: {
      method: "POST",
      path: "/standalone-query/:sourceType",
      responses: {
        200: DataQueryResponseSchema,
        400: z.object({
          error: z.string(),
        }),
      },
      pathParams: z.object({
        sourceType: z.string(),
      }),
      body: InsightsQueryRequestSchema,
    },
  },
  {
    strictStatusCodes: true,
  },
);
