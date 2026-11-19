/**
 * DMN decision requirements diagram (DRD) node manifests.
 *
 * One manifest per DMN element a DRD draws. `nodeType` mirrors the DMN element name (`dmn:*`
 * rather than `uipath.<flow>.<type>`), so a node's type maps straight onto its `drgElement` and
 * existing diagrams keep their node types. Each element has its own icon (lucide sized for the
 * icon tile, registered as `dmn-*`) and its own icon tile, a theme token from `variables.css`.
 *
 * Requirement lines run from the required element up to the element that requires it: every node
 * has one source handle on top, and one target handle on the bottom per requirement kind it can
 * receive, so lines of different kinds land on different points. Which elements may feed which is
 * the consumer's rule to enforce; these handles only say where each kind lands.
 *
 * Labels are the English the schema requires. Consumers replace them with translated ones and add
 * their own toolbar actions.
 */

import type { CategoryManifest, NodeManifest } from '../../schema/node-definition';

export const DMN_DRD_CATEGORY_ID = 'dmn-drd';

/** The source handle every DRD element draws its requirement lines from. */
export const DMN_REQUIREMENT_SOURCE_HANDLE = 'requirement-source';

/** The target handle each DMN requirement kind lands on. */
export const DMN_REQUIREMENT_TARGET_HANDLE = {
  knowledgeRequirement: 'requirement-target-knowledge',
  informationRequirement: 'requirement-target-information',
  authorityRequirement: 'requirement-target-authority',
} as const;

export type DmnRequirementKind = keyof typeof DMN_REQUIREMENT_TARGET_HANDLE;

/** Icon ids for the DRD elements, registered in the canvas icon registry. */
export const DMN_ICON = {
  decisionTable: 'dmn-decision-table',
  decisionExpression: 'dmn-decision-expression',
  inputData: 'dmn-input-data',
  knowledgeModel: 'dmn-knowledge-model',
  knowledgeSource: 'dmn-knowledge-source',
  textAnnotation: 'dmn-text-annotation',
} as const;

// ============================================================================
// Categories
// ============================================================================

export const dmnFlowCategories: CategoryManifest[] = [
  {
    id: DMN_DRD_CATEGORY_ID,
    name: 'Decision requirements',
    sortOrder: 0,
    // The plain lucide icon: the category sits in palettes beside full-size icons, so it doesn't
    // take the tile-sized `dmn-*` one.
    icon: 'table-2',
    tags: ['dmn', 'decision', 'rule'],
  },
];

// ============================================================================
// Handles
// ============================================================================

/** A fresh object per manifest, so a consumer editing one element's handles leaves the rest. */
const requirementSource = () => ({
  position: 'top' as const,
  handles: [
    {
      id: DMN_REQUIREMENT_SOURCE_HANDLE,
      type: 'source' as const,
      handleType: 'output' as const,
      // Elements are added from the node's toolbar, which knows which pairs DMN allows.
      showButton: false,
    },
  ],
});

/**
 * One target handle per requirement kind, spread along the bottom edge. No `label`: a label is
 * drawn at all times, and three of them side by side on one card overlap.
 */
const requirementTargets = (kinds: readonly DmnRequirementKind[]) => ({
  position: 'bottom' as const,
  handles: kinds.map((kind) => ({
    id: DMN_REQUIREMENT_TARGET_HANDLE[kind],
    type: 'target' as const,
    handleType: 'input' as const,
  })),
});

// ============================================================================
// Nodes
// ============================================================================

export const dmnDecisionManifest: NodeManifest = {
  nodeType: 'dmn:decision',
  version: '1.0.0',
  description: 'A decision, whose logic is a decision table or an expression.',
  category: DMN_DRD_CATEGORY_ID,
  tags: ['dmn', 'decision'],
  sortOrder: 0,
  display: {
    label: 'Decision',
    // What a decision starts out as; a decision holding an expression overrides it per node.
    icon: DMN_ICON.decisionTable,
    iconBackground: 'var(--canvas-dmn-decision-tile, var(--canvas-background-secondary))',
    shape: 'rectangle',
  },
  handleConfiguration: [
    requirementSource(),
    requirementTargets(['knowledgeRequirement', 'informationRequirement', 'authorityRequirement']),
  ],
};

export const dmnInputDataManifest: NodeManifest = {
  nodeType: 'dmn:inputData',
  version: '1.0.0',
  description: 'A value supplied to the decisions from outside the model.',
  category: DMN_DRD_CATEGORY_ID,
  tags: ['dmn', 'input'],
  sortOrder: 1,
  display: {
    label: 'Input data',
    icon: DMN_ICON.inputData,
    iconBackground: 'var(--canvas-dmn-input-data-tile, var(--canvas-background-secondary))',
    shape: 'pill',
  },
  // Nothing feeds an input: it is where data enters the model.
  handleConfiguration: [requirementSource()],
};

export const dmnKnowledgeModelManifest: NodeManifest = {
  nodeType: 'dmn:businessKnowledgeModel',
  version: '1.0.0',
  description: 'Reusable decision logic a decision can invoke.',
  category: DMN_DRD_CATEGORY_ID,
  tags: ['dmn', 'bkm', 'knowledge'],
  sortOrder: 2,
  display: {
    label: 'Knowledge model',
    icon: DMN_ICON.knowledgeModel,
    iconBackground: 'var(--canvas-dmn-knowledge-model-tile, var(--canvas-background-secondary))',
    shape: 'clipped',
  },
  handleConfiguration: [
    requirementSource(),
    requirementTargets(['knowledgeRequirement', 'authorityRequirement']),
  ],
};

export const dmnKnowledgeSourceManifest: NodeManifest = {
  nodeType: 'dmn:knowledgeSource',
  version: '1.0.0',
  description: 'The authority a decision or knowledge model derives from.',
  category: DMN_DRD_CATEGORY_ID,
  tags: ['dmn', 'authority', 'knowledge'],
  sortOrder: 3,
  display: {
    label: 'Knowledge source',
    icon: DMN_ICON.knowledgeSource,
    iconBackground: 'var(--canvas-dmn-knowledge-source-tile, var(--canvas-background-secondary))',
    shape: 'document',
  },
  handleConfiguration: [requirementSource(), requirementTargets(['authorityRequirement'])],
};

/**
 * A text annotation is free text behind a bracket, not a card: consumers draw it with their own
 * node component and use this entry for its type, handles and palette entry.
 */
export const dmnTextAnnotationManifest: NodeManifest = {
  nodeType: 'dmn:textAnnotation',
  version: '1.0.0',
  description: 'A free-text note attached to an element.',
  category: DMN_DRD_CATEGORY_ID,
  tags: ['dmn', 'annotation', 'note'],
  sortOrder: 4,
  display: { label: 'Text annotation', icon: DMN_ICON.textAnnotation },
  handleConfiguration: [requirementSource()],
};

export const dmnFlowNodes: NodeManifest[] = [
  dmnDecisionManifest,
  dmnInputDataManifest,
  dmnKnowledgeModelManifest,
  dmnKnowledgeSourceManifest,
  dmnTextAnnotationManifest,
];

// ============================================================================
// Combined Manifest
// ============================================================================

export const dmnFlowManifest = {
  version: '1.0.0',
  categories: dmnFlowCategories,
  nodes: dmnFlowNodes,
};
