// Leaf module: node-manifest and toolbar both need this, and they import each other.

import { z } from 'zod';

export const nodeShapeSchema = z.enum(['circle', 'square', 'rectangle', 'container']);

export type NodeShape = z.infer<typeof nodeShapeSchema>;
