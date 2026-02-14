import { z } from 'zod';
import { idSchema } from './base';

/**
 * A connection between nodes in a workflow
 */
export const edgeSchema = z.object({
  id: idSchema,
  sourceNodeId: idSchema,
  /** The source port name (output port) */
  sourcePort: z.string().min(1),
  targetNodeId: idSchema,
  /** The target port name (input port) */
  targetPort: z.string().min(1),
});

// Export inferred TypeScript type
export type EdgeInstance = z.infer<typeof edgeSchema>;
