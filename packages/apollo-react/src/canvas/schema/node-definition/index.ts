export type {
  CategoryManifest,
  ConnectionConstraint,
  HandleCategory,
  HandleConfigurationSpecificPosition,
  HandleGroupManifest,
  HandleGroupOverride,
  HandleManifest,
  HandlePosition,
  HandleTarget,
  HandleType,
} from '@uipath/flow-node-schema';

export {
  categoryManifestSchema,
  handleGroupManifestSchema,
  handleGroupOverrideSchema,
  handleManifestSchema,
  handlePositionSchema,
  handleTypeDisplaySchema,
  handleTypeSchema,
} from '@uipath/flow-node-schema';

// Re-export from local file to preserve narrowed NodeManifest type (form?: FormSchema)
export type { NodeDisplayManifest, NodeManifest, NodeShape } from './node-manifest';
export { nodeDisplayManifestSchema, nodeManifestSchema, nodeShapeSchema } from './node-manifest';
