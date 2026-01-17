import { beforeEach, describe, expect, it } from 'vitest';
import { ListItem } from '../components';
import type { PreviewNodeConnectionInfo } from '../hooks';
import type { WorkflowManifest } from '../schema/node-definition';
import { NodeTypeRegistry } from './NodeTypeRegistry';

describe('NodeTypeRegistry', () => {
  let registry: NodeTypeRegistry;

  const createMockManifest = (): WorkflowManifest => ({
    version: '1.0.0',
    categories: [
      {
        id: 'control-flow',
        name: 'Control Flow',
        icon: 'flow',
        parentId: undefined,
        sortOrder: 1,
        color: '#0000FF',
        colorDark: '#0000AA',
        tags: [],
      },
      {
        id: 'automation',
        name: 'Automation',
        icon: 'automation',
        parentId: undefined,
        sortOrder: 2,
        color: '#00FF00',
        colorDark: '#00AA00',
        tags: [],
      },
      {
        id: 'automation.files',
        name: 'Files',
        icon: 'folder',
        parentId: 'automation',
        sortOrder: 1,
        color: '#FF0000',
        colorDark: '#AA0000',
        tags: [],
      },
      {
        id: 'automation.email',
        name: 'Email',
        icon: 'email',
        parentId: 'automation',
        sortOrder: 2,
        color: '#FFFF00',
        colorDark: '#AAAA00',
        tags: [],
      },
      {
        id: 'ai',
        name: 'AI',
        icon: 'ai',
        parentId: undefined,
        sortOrder: 3,
        color: '#FF00FF',
        colorDark: '#AA00AA',
        tags: [],
      },
    ],
    nodes: [
      {
        nodeType: 'trigger',
        category: 'control-flow',
        version: '1.0.0',
        display: {
          label: 'Trigger',
          icon: 'trigger',
        },
        description: 'Start workflow',
        sortOrder: 1,
        handleConfiguration: [
          {
            position: 'right',
            handles: [
              {
                id: 'output',
                type: 'source',
                handleType: 'output',
                label: 'Output',
                isDefaultForType: true,
                constraints: {
                  allowedTargetCategories: ['automation', 'automation.files', 'automation.email'],
                },
              },
            ],
          },
        ],
        tags: ['start', 'trigger'],
      },
      {
        nodeType: 'read-file',
        category: 'automation.files',
        version: '1.0.0',
        display: {
          label: 'Read File',
          icon: 'file-open',
        },
        description: 'Read content from a file',
        sortOrder: 1,
        handleConfiguration: [
          {
            position: 'left',
            handles: [
              {
                id: 'input',
                type: 'target',
                handleType: 'input',
                label: 'Input',
                isDefaultForType: true,
              },
              {
                id: 'output',
                type: 'source',
                handleType: 'output',
                label: 'Output',
                isDefaultForType: true,
              },
            ],
          },
        ],
        tags: ['file', 'read', 'input'],
      },
      {
        nodeType: 'write-file',
        category: 'automation.files',
        version: '1.0.0',
        display: {
          label: 'Write File',
          icon: 'file-save',
        },
        description: 'Write content to a file',
        sortOrder: 2,
        handleConfiguration: [
          {
            position: 'left',
            handles: [
              {
                id: 'input',
                type: 'target',
                handleType: 'input',
                label: 'Input',
                isDefaultForType: true,
              },
            ],
          },
        ],
        tags: ['file', 'write', 'output'],
      },
      {
        nodeType: 'send-email',
        category: 'automation.email',
        version: '1.0.0',
        display: {
          label: 'Send Email',
          icon: 'send',
        },
        description: 'Send an email message',
        sortOrder: 1,
        handleConfiguration: [
          {
            position: 'left',
            handles: [
              {
                id: 'input',
                type: 'target',
                handleType: 'input',
                label: 'Input',
                isDefaultForType: true,
              },
            ],
          },
        ],
        tags: ['email', 'send'],
      },
      {
        nodeType: 'agent',
        category: 'ai',
        version: '1.0.0',
        display: {
          label: 'AI Agent',
          icon: 'agent',
          description: 'AI agent',
        },
        sortOrder: 1,
        tags: [],
        handleConfiguration: [
          {
            position: 'top',
            handles: [
              {
                id: 'input',
                type: 'target',
                handleType: 'input',
                label: 'Input',
                isDefaultForType: true,
              },
              {
                id: 'model',
                type: 'target',
                handleType: 'artifact',
                label: 'Model',
                isDefaultForType: false,
                constraints: {
                  allowedSourceCategories: ['ai'],
                },
              },
            ],
          },
        ],
      },
      {
        nodeType: 'model',
        category: 'ai',
        version: '1.0.0',
        display: {
          label: 'AI Model',
          icon: 'model',
          description: 'AI model',
        },
        sortOrder: 2,
        tags: [],
        handleConfiguration: [
          {
            position: 'bottom',
            handles: [
              {
                id: 'output',
                type: 'source',
                handleType: 'artifact',
                label: 'Model Output',
                isDefaultForType: true,
                constraints: {
                  allowedTargets: [{ nodeType: 'agent', handleId: 'model' }],
                },
              },
            ],
          },
        ],
      },
      {
        nodeType: 'root-node',
        category: undefined,
        version: '1.0.0',
        display: {
          label: 'Root Node',
          icon: 'root',
        },
        description: 'A node at root level',
        sortOrder: 1,
        handleConfiguration: [
          {
            position: 'left',
            handles: [
              {
                id: 'input',
                type: 'target',
                handleType: 'input',
                label: 'Input',
                isDefaultForType: true,
              },
            ],
          },
        ],
        tags: ['root'],
      },
    ],
  });

  beforeEach(() => {
    registry = new NodeTypeRegistry();
    registry.registerManifest(createMockManifest());
  });

  describe('registerManifest', () => {
    it('should register all categories', () => {
      const categories = registry.getAllCategories();
      expect(categories).toHaveLength(5);
      expect(categories).toContain('control-flow');
      expect(categories).toContain('automation.files');
    });

    it('should register all node types', () => {
      const nodeTypes = registry.getAllNodeTypes();
      expect(nodeTypes).toHaveLength(7);
      expect(nodeTypes).toContain('trigger');
      expect(nodeTypes).toContain('read-file');
    });

    it('should build category tree', () => {
      const tree = registry.getCategoryTree();
      expect(tree).not.toBeNull();
      expect(tree!.getRootCategories()).toHaveLength(3);
    });

    it('should organize handles by type', () => {
      const handles = registry.getHandlesByNodeType('read-file');
      expect(handles.source).toHaveLength(1);
      expect(handles.target).toHaveLength(1);
    });

    it('should pre-compute category descendants', () => {
      const descendants = registry.categoryDescendants.get('automation');
      expect(descendants).toContain('automation.files');
      expect(descendants).toContain('automation.email');
    });

    it('should pre-compute category ancestors', () => {
      const ancestors = registry.categoryAncestors.get('automation.files');
      expect(ancestors).toContain('automation');
    });

    it('should organize nodes by category', () => {
      const nodesInFiles = registry.nodesByCategory.get('automation.files');
      expect(nodesInFiles).toHaveLength(2);
    });
  });

  describe('getManifest', () => {
    it('should retrieve node manifest by type', () => {
      const manifest = registry.getManifest('trigger');
      expect(manifest).not.toBeUndefined();
      expect(manifest?.display.label).toBe('Trigger');
    });

    it('should return undefined for non-existent type', () => {
      const manifest = registry.getManifest('nonexistent');
      expect(manifest).toBeUndefined();
    });
  });

  describe('getAllManifests', () => {
    it('should return all node manifests', () => {
      const manifests = registry.getAllManifests();
      expect(manifests).toHaveLength(7);
    });
  });

  describe('getHandlesByNodeType', () => {
    it('should return handles organized by type', () => {
      const handles = registry.getHandlesByNodeType('agent');
      expect(handles.target).toHaveLength(2);
      expect(handles.source).toBeUndefined();
    });

    it('should return empty object for non-existent node type', () => {
      const handles = registry.getHandlesByNodeType('nonexistent');
      expect(handles).toEqual({});
    });
  });

  describe('createDefaultData', () => {
    it('should create default data for a node', () => {
      const data = registry.createDefaultData('trigger', 'My Trigger');
      expect(data.nodeType).toBe('trigger');
      expect(data.version).toBe('1.0.0');
      expect(data.display!.label).toBe('My Trigger');
      expect(data.display!.icon).toBe('trigger');
    });

    it('should use manifest label when no label provided', () => {
      const data = registry.createDefaultData('trigger');
      expect(data.display!.label).toBe('Trigger');
    });

    it('should handle non-existent node types gracefully', () => {
      const data = registry.createDefaultData('nonexistent', 'Custom Label');
      expect(data.nodeType).toBe('nonexistent');
      expect(data.display!.label).toBe('Custom Label');
    });
  });

  describe('clear', () => {
    it('should clear all registrations', () => {
      registry.clear();
      expect(registry.getAllCategories()).toHaveLength(0);
      expect(registry.getAllNodeTypes()).toHaveLength(0);
      expect(registry.getCategoryTree()).toBeNull();
    });
  });

  describe('isValidCategoryForConnection', () => {
    it('should return true when no connection info provided', () => {
      expect(registry.isValidCategoryForConnection('automation', null)).toBe(true);
      expect(registry.isValidCategoryForConnection('automation', undefined)).toBe(true);
      expect(registry.isValidCategoryForConnection('automation', [])).toBe(true);
    });

    it('should validate category against allowed target categories', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      // Trigger allows connections to 'automation' category only
      expect(registry.isValidCategoryForConnection('automation', connectionInfo)).toBe(true);
      expect(registry.isValidCategoryForConnection('ai', connectionInfo)).toBe(false);
    });

    it('should validate descendant categories', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      // automation.files is a descendant of automation, which is allowed
      expect(registry.isValidCategoryForConnection('automation.files', connectionInfo)).toBe(true);
    });

    it('should check constraints when adding new node as source', () => {
      const readFileManifest = registry.getManifest('read-file')!;
      const readFileHandle = registry.getHandlesByNodeType('read-file').target![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'read-file-1',
          existingHandleId: 'input',
          existingNodeManifest: readFileManifest,
          existingHandleManifest: readFileHandle,
          addNewNodeAsSource: true,
          previewEdgeId: 'preview-edge',
        },
      ];

      // All categories should be valid (no source constraints on read-file input handle)
      expect(registry.isValidCategoryForConnection('control-flow', connectionInfo)).toBe(true);
      expect(registry.isValidCategoryForConnection('automation', connectionInfo)).toBe(true);
    });

    it('should require all connections to be valid', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];
      const agentManifest = registry.getManifest('agent')!;
      const agentHandle = registry.getHandlesByNodeType('agent').target![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge-1',
        },
        {
          existingNodeId: 'agent-1',
          existingHandleId: 'input',
          existingNodeManifest: agentManifest,
          existingHandleManifest: agentHandle,
          addNewNodeAsSource: true,
          previewEdgeId: 'preview-edge-2',
        },
      ];

      // automation is valid for trigger but may not be valid source for agent
      expect(registry.isValidCategoryForConnection('automation', connectionInfo)).toBe(true);
      // ai is not valid target for trigger
      expect(registry.isValidCategoryForConnection('ai', connectionInfo)).toBe(false);
    });
  });

  describe('isValidNodeForConnection', () => {
    it('should return true when no connection info provided', () => {
      expect(registry.isValidNodeForConnection('read-file', null)).toBe(true);
      expect(registry.isValidNodeForConnection('read-file', undefined)).toBe(true);
      expect(registry.isValidNodeForConnection('read-file', [])).toBe(true);
    });

    it('should validate node against connection constraints', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      // read-file is in automation category, which is allowed
      expect(registry.isValidNodeForConnection('read-file', connectionInfo)).toBe(true);
      // agent is in ai category, which is not allowed
      expect(registry.isValidNodeForConnection('agent', connectionInfo)).toBe(false);
    });

    it('should validate specific handle constraints', () => {
      const agentManifest = registry.getManifest('agent')!;
      const agentHandle = registry.getHandlesByNodeType('agent').target![1]!; // model handle

      expect(agentHandle.id).toBe('model');

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'agent-1',
          existingHandleId: 'model',
          existingNodeManifest: agentManifest,
          existingHandleManifest: agentHandle,
          addNewNodeAsSource: true,
          previewEdgeId: 'preview-edge',
        },
      ];

      // model output can only connect to agent's model handle
      expect(registry.isValidNodeForConnection('model', connectionInfo)).toBe(true);
      // Cannot connect to other nodes either
      expect(registry.isValidNodeForConnection('read-file', connectionInfo)).toBe(false);
    });

    it('should return false for non-existent node types', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      expect(registry.isValidNodeForConnection('nonexistent', connectionInfo)).toBe(false);
    });

    it('should use default handle for validation', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      // Should use the default target handle for read-file
      expect(registry.isValidNodeForConnection('read-file', connectionInfo)).toBe(true);
    });
  });

  describe('getNodeOptions', () => {
    it('should return all nodes when no filters applied', () => {
      const items = registry.getNodeOptions({});

      // Should have 3 root categories and 1 root node
      expect(items.length).toBeGreaterThan(0);

      // Find automation category
      const automation = items.find((item) => item.id === 'automation');
      expect(automation).toBeDefined();
      expect(automation?.children).toHaveLength(2); // files and email
    });

    it('should filter by connection constraints', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      const items = registry.getNodeOptions({ connections: connectionInfo });

      // Should only have automation category (trigger allows automation only)
      const categoryIds = items.filter((item) => item.data === null).map((item) => item.id);
      expect(categoryIds).toContain('automation');
      expect(categoryIds).not.toContain('ai');
      expect(categoryIds).not.toContain('control-flow');
    });

    it('should filter by category', () => {
      const items = registry.getNodeOptions({ category: 'automation' });

      // Should only have files and email categories (children of automation)
      const categoryIds = items.filter((item) => item.data === null).map((item) => item.id);
      expect(categoryIds).toContain('automation.files');
      expect(categoryIds).toContain('automation.email');
      expect(categoryIds).not.toContain('automation');
      expect(categoryIds).not.toContain('ai');
    });

    it('should filter by search term', () => {
      const items = registry.getNodeOptions({ search: 'email', flattenAll: true });

      // Should find send-email node in email category
      const nodeIds = items.map((item) => item.id);

      expect(nodeIds).toContain('send-email');
      expect(nodeIds).not.toContain('read-file');
    });

    it('should flatten all categories when flattenAll is true', () => {
      const items = registry.getNodeOptions({ flattenAll: true });

      // All items should be nodes (no categories)
      const hasCategories = items.some((item) => item.data === null);
      expect(hasCategories).toBe(false);

      // Should have all 7 nodes
      expect(items).toHaveLength(7);
    });

    it('should flatten single path when flattenSinglePath is true', () => {
      const items = registry.getNodeOptions({
        category: 'ai',
        flattenSinglePath: false,
      });

      // Without flattening, should have category structure
      expect(items.length).toBe(2); // 2 nodes in ai category

      const itemsFlattened = registry.getNodeOptions({
        category: 'ai',
        flattenSinglePath: true,
      });

      // With flattening, nodes should be at root level
      expect(itemsFlattened.length).toBe(2);
      expect(itemsFlattened.every((item) => item.data !== null)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      const items = registry.getNodeOptions({
        connections: connectionInfo,
        search: 'file',
        flattenAll: true,
      });

      // Should only have file-related nodes from automation category
      expect(items.every((item) => item.data !== null)).toBe(true);
      expect(items.some((item) => item.id === 'read-file')).toBe(true);
      expect(items.some((item) => item.id === 'write-file')).toBe(true);
      expect(items.some((item) => item.id === 'send-email')).toBe(false);
      expect(items.some((item) => item.id === 'agent')).toBe(false);
    });

    it('should return empty array when no matches found', () => {
      const items = registry.getNodeOptions({
        search: 'nonexistent-search-term-xyz',
      });

      expect(items).toHaveLength(0);
    });

    it('should handle iconResolver when provided', () => {
      const mockIconResolver = (_iconName: string) => {
        return () => null; // Mock component
      };

      const items = registry.getNodeOptions({
        iconResolver: mockIconResolver,
      });

      // Check that icons have Component property
      const firstCategory = items[0];
      expect(firstCategory).toBeDefined();
      expect(firstCategory?.icon).toBeDefined();
      expect(firstCategory?.icon).toHaveProperty('Component');
    });

    it('should handle nodes without iconResolver', () => {
      const items = registry.getNodeOptions({});

      // Check that icons have name property
      const firstCategory = items[0];
      expect(firstCategory).toBeDefined();
      expect(firstCategory?.icon).toBeDefined();
      expect(firstCategory?.icon).toHaveProperty('name');
    });

    it('should preserve sorting order', () => {
      const items = registry.getNodeOptions({ flattenAll: true });

      // Find trigger and read-file nodes
      const trigger = items.find((item) => item.id === 'trigger');
      const readFile = items.find((item) => item.id === 'read-file');

      expect(trigger).toBeDefined();
      expect(readFile).toBeDefined();

      // Trigger has sortOrder 1 in control-flow, read-file has sortOrder 1 in automation.files
      // They should be ordered by their category sortOrder, then node sortOrder
      const triggerIndex = items.indexOf(trigger!);
      const readFileIndex = items.indexOf(readFile!);

      // control-flow (sortOrder 1) comes before automation (sortOrder 2)
      expect(triggerIndex).toBeLessThan(readFileIndex);
    });

    it('should include root nodes', () => {
      const items = registry.getNodeOptions({ flattenAll: true });

      const rootNode = items.find((item) => item.id === 'root-node');
      expect(rootNode).toBeDefined();
      expect(rootNode?.name).toBe('Root Node');
    });

    it('should handle specific handle validation in connections', () => {
      const modelManifest = registry.getManifest('model')!;
      const modelHandle = registry.getHandlesByNodeType('model').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'model-1',
          existingHandleId: 'output',
          existingNodeManifest: modelManifest,
          existingHandleManifest: modelHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      const items = registry.getNodeOptions({
        connections: connectionInfo,
        flattenAll: true,
      });

      // Model's constraint requires specific handle ID ('model'), but the validation
      // uses the default handle ('input'), so agent won't match. No nodes will be valid.
      expect(items).toHaveLength(0);
    });

    it('should work with empty manifest', () => {
      const emptyRegistry = new NodeTypeRegistry();
      emptyRegistry.registerManifest({ version: '1.0.0', categories: [], nodes: [] });

      const items = emptyRegistry.getNodeOptions({});
      expect(items).toHaveLength(0);
    });

    it('should handle deeply nested categories', () => {
      const deepManifest: WorkflowManifest = {
        version: '1.0.0',
        categories: [
          {
            id: 'level1',
            name: 'Level 1',
            icon: 'icon1',
            parentId: undefined,
            sortOrder: 1,
            color: '#000000',
            colorDark: '#000000',
            tags: [],
          },
          {
            id: 'level2',
            name: 'Level 2',
            icon: 'icon2',
            parentId: 'level1',
            sortOrder: 1,
            color: '#000000',
            colorDark: '#000000',
            tags: [],
          },
          {
            id: 'level3',
            name: 'Level 3',
            icon: 'icon3',
            parentId: 'level2',
            sortOrder: 1,
            color: '#000000',
            colorDark: '#000000',
            tags: [],
          },
        ],
        nodes: [
          {
            nodeType: 'deep-node',
            category: 'level3',
            version: '1.0.0',
            display: { label: 'Deep Node', icon: 'deep' },
            sortOrder: 1,
            tags: [],
            handleConfiguration: [],
          },
        ],
      };

      const deepRegistry = new NodeTypeRegistry();
      deepRegistry.registerManifest(deepManifest);

      const items = deepRegistry.getNodeOptions({});
      expect(items).toHaveLength(1);
      expect(items[0]?.id).toBe('level1');
      const level1Children = items[0]?.children as ListItem[];
      expect(Array.isArray(level1Children)).toBe(true);
      expect(level1Children?.length).toBe(1);
      expect(level1Children?.[0]?.id).toBe('level2');
      const level2Children = level1Children?.[0]?.children as ListItem[];
      expect(Array.isArray(level2Children)).toBe(true);
      expect(level2Children?.length).toBe(1);
      expect(level2Children?.[0]?.id).toBe('level3');
    });
  });

  describe('integration tests', () => {
    it('should handle full workflow of filtering and displaying nodes', () => {
      // Simulate adding a node after a trigger
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      // Get filtered options
      const items = registry.getNodeOptions({
        connections: connectionInfo,
      });

      // Should only show automation nodes
      const allNodeIds = items
        .flatMap((item) => (item.children && Array.isArray(item.children) ? item.children : [item]))
        .flatMap((item) => (item.children && Array.isArray(item.children) ? item.children : [item]))
        .filter((item) => item.data !== null)
        .map((item) => item.id);

      expect(allNodeIds).toContain('read-file');
      expect(allNodeIds).toContain('write-file');
      expect(allNodeIds).toContain('send-email');
      expect(allNodeIds).not.toContain('agent');
      expect(allNodeIds).not.toContain('model');
      expect(allNodeIds).not.toContain('trigger');
    });

    it('should handle searching within constrained results', () => {
      const triggerManifest = registry.getManifest('trigger')!;
      const triggerHandle = registry.getHandlesByNodeType('trigger').source![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'trigger-1',
          existingHandleId: 'output',
          existingNodeManifest: triggerManifest,
          existingHandleManifest: triggerHandle,
          addNewNodeAsSource: false,
          previewEdgeId: 'preview-edge',
        },
      ];

      // Search for "file" within automation category constraint
      const items = registry.getNodeOptions({
        connections: connectionInfo,
        search: 'file',
        flattenAll: true,
      });

      expect(items).toHaveLength(2);
      expect(items.some((item) => item.id === 'read-file')).toBe(true);
      expect(items.some((item) => item.id === 'write-file')).toBe(true);
    });

    it('should validate complex multi-handle scenarios', () => {
      // Agent has both flow input and artifact (model) input
      const agentManifest = registry.getManifest('agent')!;
      const agentFlowHandle = registry.getHandlesByNodeType('agent').target![0];

      const connectionInfo: PreviewNodeConnectionInfo[] = [
        {
          existingNodeId: 'agent-1',
          existingHandleId: 'input',
          existingNodeManifest: agentManifest,
          existingHandleManifest: agentFlowHandle,
          addNewNodeAsSource: true,
          previewEdgeId: 'preview-edge',
        },
      ];

      // Should allow any source nodes with output handles
      const items = registry.getNodeOptions({
        connections: connectionInfo,
        flattenAll: true,
      });

      expect(items.some((item) => item.id === 'read-file')).toBe(true);
      // Trigger has allowed target categories that do not include ai, so it should be excluded.
      expect(items.some((item) => item.id === 'trigger')).toBe(false);
      // Model node has artifact output, but type mismatches with agent's flow input, so it should be excluded.
      expect(items.some((item) => item.id === 'model')).toBe(false);
    });
  });
});
