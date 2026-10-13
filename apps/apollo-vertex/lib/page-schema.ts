import { pageSchema } from "fumadocs-core/source/schema";
import { z } from "zod";

export const docsPageSchema = pageSchema.extend({
  // Browser tab title, when it differs from the sidebar title.
  metaTitle: z.string().optional(),
  // Component guidance, rendered on the page and in the
  // vertex-component-catalog agent skill.
  whenToUse: z.array(z.string()).optional(),
  avoidWhen: z
    .array(
      z.object({
        when: z.string(),
        // Slug of the component page to use instead.
        use: z.string().optional(),
      }),
    )
    .optional(),
  // Short usage snippet that imports from "@uipath/apollo-vertex".
  example: z.string().optional(),
  // Registry directories whose package exports this page documents.
  // Defaults to the page slug.
  registry: z.array(z.string()).optional(),
});

export type DocsPageData = z.infer<typeof docsPageSchema>;
