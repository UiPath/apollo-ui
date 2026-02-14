import { allCategoryManifests } from './category-definitions';
import { allNodeManifests } from './node-definitions';

export * from './category-definitions';
export * from './node-definitions';

/**
 * Complete workflow manifest with all categories and nodes for Storybook stories.
 */
export const defaultWorkflowManifest = {
  version: '1.0.0',
  categories: allCategoryManifests,
  nodes: allNodeManifests,
};
