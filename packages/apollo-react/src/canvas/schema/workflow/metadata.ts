import { z } from 'zod';

/**
 * Workflow metadata
 */
export const metadataSchema = z.object({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// Export inferred TypeScript type
export type Metadata = z.infer<typeof metadataSchema>;
