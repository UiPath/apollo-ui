import type { FormSchema } from '@uipath/apollo-wind';
import {
  nodeManifestSchema as baseNodeManifestSchema,
  type NodeManifest as BaseNodeManifest,
} from '@uipath/flow-node-schema';
import { z } from 'zod';

export type { NodeShape, NodeDisplayManifest } from '@uipath/flow-node-schema';
export { nodeShapeSchema, nodeDisplayManifestSchema } from '@uipath/flow-node-schema';

/**
 * Node manifest schema with `form` narrowed to FormSchema from @uipath/apollo-wind.
 * Extends the base schema from @uipath/flow-node-schema so that
 * `z.infer<typeof nodeManifestSchema>` matches the exported `NodeManifest` type.
 */
export const nodeManifestSchema = baseNodeManifestSchema.extend({
  form: z.custom<FormSchema>().optional(),
});

/**
 * NodeManifest with the `form` field narrowed to the full FormSchema type
 * from @uipath/apollo-wind, preserving backward compatibility for apollo-react consumers.
 */
export type NodeManifest = Omit<BaseNodeManifest, 'form'> & {
  form?: FormSchema;
};
