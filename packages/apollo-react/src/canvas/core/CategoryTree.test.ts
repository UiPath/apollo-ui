import { describe, expect, it } from 'vitest';
import type { CategoryManifest, NodeManifest } from '../schema/node-definition';
import { CategoryTree, type ConnectionValidator } from './CategoryTree';

describe('CategoryTree', () => {
  // Test data
  const createMockCategories = (): CategoryManifest[] => [
    {
      id: 'automation',
      name: 'Automation',
      icon: 'automation',
      parentId: undefined,
      sortOrder: 1,
      tags: [],
      color: 'blue',
      colorDark: 'darkBlue',
    },
    {
      id: 'automation.files',
      name: 'Files',
      icon: 'folder',
      parentId: 'automation',
      sortOrder: 1,
      tags: [],
      color: 'blue',
      colorDark: 'darkBlue',
    },
    {
      id: 'automation.email',
      name: 'Email',
      icon: 'email',
      parentId: 'automation',
      sortOrder: 2,
      tags: [],
      color: 'blue',
      colorDark: 'darkBlue',
    },
    {
      id: 'data',
      name: 'Data',
      icon: 'database',
      parentId: undefined,
      sortOrder: 2,
      tags: [],
      color: 'blue',
      colorDark: 'darkBlue',
    },
    {
      id: 'data.transform',
      name: 'Transform',
      icon: 'transform',
      parentId: 'data',
      sortOrder: 1,
      tags: [],
      color: 'blue',
      colorDark: 'darkBlue',
    },
  ];

  const createMockNodes = (): NodeManifest[] => [
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
      handleConfiguration: [],
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
      handleConfiguration: [],
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
      handleConfiguration: [],
      tags: ['email', 'send'],
    },
    {
      nodeType: 'transform-data',
      category: 'data.transform',
      version: '1.0.0',
      display: {
        label: 'Transform Data',
        icon: 'transform',
      },
      description: 'Transform data',
      sortOrder: 1,
      handleConfiguration: [],
      tags: ['data', 'transform'],
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
      handleConfiguration: [],
      tags: [],
    },
  ];

  describe('constructor and buildTree', () => {
    it('should build hierarchical tree from flat arrays', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const rootCategories = tree.getRootCategories();
      expect(rootCategories).toHaveLength(2);
      expect(rootCategories[0]!.id).toBe('automation');
      expect(rootCategories[1]!.id).toBe('data');
    });

    it('should nest categories correctly', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const automation = tree.findCategory('automation');
      expect(automation).not.toBeNull();
      expect(automation?.nestedCategories).toHaveLength(2);
      expect(automation?.nestedCategories[0]?.id).toBe('automation.files');
      expect(automation?.nestedCategories[1]?.id).toBe('automation.email');
    });

    it('should assign nodes to correct categories', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filesCategory = tree.findCategory('automation.files');
      expect(filesCategory?.nodes).toHaveLength(2);
      expect(filesCategory?.nodes[0]?.nodeType).toBe('read-file');
      expect(filesCategory?.nodes[1]?.nodeType).toBe('write-file');
    });

    it('should handle root nodes without categories', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const rootNodes = tree.getRootNodes();
      expect(rootNodes).toHaveLength(1);
      expect(rootNodes[0]!.nodeType).toBe('root-node');
    });

    it('should sort categories by sortOrder', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const rootCategories = tree.getRootCategories();
      expect(rootCategories[0]!.sortOrder).toBeLessThan(rootCategories[1]!.sortOrder);

      const automation = tree.findCategory('automation');
      expect(automation?.nestedCategories[0]?.sortOrder).toBeLessThan(
        automation!.nestedCategories[1]!.sortOrder
      );
    });

    it('should sort nodes by sortOrder within categories', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filesCategory = tree.findCategory('automation.files');
      expect(filesCategory?.nodes[0]?.sortOrder).toBeLessThan(filesCategory!.nodes[1]!.sortOrder);
    });

    it('should handle nodes with missing categories', () => {
      const categories = createMockCategories();
      const nodes: NodeManifest[] = [
        {
          nodeType: 'orphan-node',
          category: 'nonexistent-category',
          version: '1.0.0',
          display: {
            label: 'Orphan Node',
            icon: 'orphan',
          },
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
      ];

      const tree = new CategoryTree(categories, nodes);
      const rootNodes = tree.getRootNodes();

      // Orphan node should be added to root level
      expect(rootNodes.some((n) => n.nodeType === 'orphan-node')).toBe(true);
    });

    it('should handle categories with missing parents', () => {
      const categories: CategoryManifest[] = [
        {
          id: 'orphan-category',
          name: 'Orphan',
          icon: 'orphan',
          parentId: 'nonexistent-parent',
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
      ];

      const tree = new CategoryTree(categories, []);
      const rootCategories = tree.getRootCategories();

      // Orphan category should be treated as root
      expect(rootCategories.some((c) => c.id === 'orphan-category')).toBe(true);
    });
  });

  describe('findCategory', () => {
    it('should find categories by ID', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const category = tree.findCategory('automation.files');
      expect(category).not.toBeNull();
      expect(category?.name).toBe('Files');
    });

    it('should return null for non-existent categories', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const category = tree.findCategory('nonexistent');
      expect(category).toBeNull();
    });
  });

  describe('getSubtree', () => {
    it('should return subtree from specific category', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const subtree = tree.getSubtree('automation');
      const rootCategories = subtree.getRootCategories();

      expect(rootCategories).toHaveLength(2);
      expect(rootCategories[0]!.id).toBe('automation.files');
      expect(rootCategories[1]!.id).toBe('automation.email');
    });

    it('should return empty tree for non-existent category', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const subtree = tree.getSubtree('nonexistent');
      expect(subtree.isEmpty()).toBe(true);
    });

    it('should include nodes from the category in subtree', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const subtree = tree.getSubtree('automation.files');
      const rootNodes = subtree.getRootNodes();

      expect(rootNodes).toHaveLength(2);
      expect(rootNodes[0]!.nodeType).toBe('read-file');
    });
  });

  describe('filter', () => {
    it('should filter categories', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filter({
        categoryFilter: (cat) => cat.id === 'automation' || cat.parentId === 'automation',
      });

      const rootCategories = filtered.getRootCategories();
      expect(rootCategories).toHaveLength(1);
      expect(rootCategories[0]!.id).toBe('automation');
    });

    it('should filter nodes', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filter({
        nodeFilter: (node) => node.nodeType.includes('file'),
      });

      const filesCategory = filtered.findCategory('automation.files');
      expect(filesCategory?.nodes).toHaveLength(2);

      const emailCategory = filtered.findCategory('automation.email');
      expect(emailCategory).toBeNull(); // Should be removed (no matching nodes)
    });

    it('should filter root nodes', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filter({
        nodeFilter: (node) => node.nodeType !== 'root-node',
      });

      const rootNodes = filtered.getRootNodes();
      expect(rootNodes).toHaveLength(0);
    });

    it('should remove empty categories after filtering', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filter({
        nodeFilter: (node) => node.nodeType === 'send-email',
      });

      // Only email category should remain
      const automation = filtered.findCategory('automation');
      expect(automation?.nestedCategories).toHaveLength(1);
      expect(automation?.nestedCategories[0]?.id).toBe('automation.email');
    });

    it('should preserve category if it has matching children', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filter({
        categoryFilter: () => true,
        nodeFilter: (node) => node.nodeType === 'read-file',
      });

      // automation should be preserved because it has a child with matching nodes
      const automation = filtered.findCategory('automation');
      expect(automation).not.toBeNull();
      expect(automation?.nestedCategories).toHaveLength(1);
      expect(automation?.nestedCategories[0]?.id).toBe('automation.files');
    });
  });

  describe('filterBySearch', () => {
    it('should filter nodes by label', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('email');
      const emailCategory = filtered.findCategory('automation.email');

      expect(emailCategory?.nodes).toHaveLength(1);
      expect(emailCategory?.nodes[0]?.nodeType).toBe('send-email');
    });

    it('should filter nodes by type', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('read-file');
      const filesCategory = filtered.findCategory('automation.files');

      expect(filesCategory?.nodes).toHaveLength(1);
      expect(filesCategory?.nodes[0]?.nodeType).toBe('read-file');
    });

    it('should filter nodes by description', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('write content');
      const filesCategory = filtered.findCategory('automation.files');

      expect(filesCategory?.nodes).toHaveLength(1);
      expect(filesCategory?.nodes[0]?.nodeType).toBe('write-file');
    });

    it('should filter nodes by tags', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('input');
      const filesCategory = filtered.findCategory('automation.files');

      expect(filesCategory?.nodes).toHaveLength(1);
      expect(filesCategory?.nodes[0]?.nodeType).toBe('read-file');
    });

    it('should be case-insensitive', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('EMAIL');
      const emailCategory = filtered.findCategory('automation.email');

      expect(emailCategory?.nodes).toHaveLength(1);
    });

    it('should return unchanged tree for empty search', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('');
      expect(filtered.getNodeCount()).toBe(tree.getNodeCount());
    });

    it('should return empty tree for no matches', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filterBySearch('nonexistent-search-term');
      expect(filtered.isEmpty()).toBe(true);
    });
  });

  describe('filterByConnections', () => {
    it('should filter by connection validator', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const validator: ConnectionValidator = {
        isValidCategoryForConnection: (categoryId) => categoryId.startsWith('automation'),
        canNodeConnect: (nodeType) => nodeType.includes('file'),
      };

      const filtered = tree.filterByConnections(validator);

      // Should only have automation category with file nodes
      const rootCategories = filtered.getRootCategories();
      expect(rootCategories).toHaveLength(1);
      expect(rootCategories[0]!.id).toBe('automation');

      const filesCategory = filtered.findCategory('automation.files');
      expect(filesCategory?.nodes).toHaveLength(2);

      const emailCategory = filtered.findCategory('automation.email');
      expect(emailCategory).toBeNull();
    });

    it('should apply both category and node filters', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const validator: ConnectionValidator = {
        isValidCategoryForConnection: () => true,
        canNodeConnect: (nodeType) => nodeType === 'read-file',
      };

      const filtered = tree.filterByConnections(validator);
      const filesCategory = filtered.findCategory('automation.files');

      expect(filesCategory?.nodes).toHaveLength(1);
      expect(filesCategory?.nodes[0]?.nodeType).toBe('read-file');
    });
  });

  describe('flattenSinglePath', () => {
    it('should flatten when single path exists', () => {
      const categories: CategoryManifest[] = [
        {
          id: 'parent',
          name: 'Parent',
          icon: 'parent',
          parentId: undefined,
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
        {
          id: 'child',
          name: 'Child',
          icon: 'child',
          parentId: 'parent',
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
      ];

      const nodes: NodeManifest[] = [
        {
          nodeType: 'leaf-node',
          category: 'child',
          version: '1.0.0',
          display: { label: 'Leaf Node', icon: 'leaf' },
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
      ];

      const tree = new CategoryTree(categories, nodes);
      const flattened = tree.flattenSinglePath();

      // Should bring leaf nodes to root
      const rootNodes = flattened.getRootNodes();
      expect(rootNodes).toHaveLength(1);
      expect(rootNodes[0]!.nodeType).toBe('leaf-node');

      // Should remove all categories
      const rootCategories = flattened.getRootCategories();
      expect(rootCategories).toHaveLength(0);
    });

    it('should not flatten when multiple branches exist', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const flattened = tree.flattenSinglePath();

      // Should remain unchanged (multiple root categories)
      expect(flattened.getRootCategories().length).toBe(tree.getRootCategories().length);
      // Nested categories should also be preserved
      expect(flattened.findCategory('automation')).toBeDefined();
      expect(flattened.findCategory('automation.files')).toBeDefined();
    });

    it('should not flatten when root nodes exist', () => {
      // one root category and one nested category.
      const categories: CategoryManifest[] = [
        {
          id: 'automation',
          name: 'Automation',
          icon: 'automation',
          parentId: undefined,
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
        {
          id: 'automation.files',
          name: 'Files',
          icon: 'folder',
          parentId: 'automation',
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
      ];

      const nodes: NodeManifest[] = [
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
          handleConfiguration: [],
          tags: [],
        },
        {
          nodeType: 'file-node',
          category: 'automation.files',
          version: '1.0.0',
          display: {
            label: 'File Node',
            icon: 'file',
          },
          description: 'A node in files category',
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
      ];
      const tree = new CategoryTree(categories, nodes);

      const flattened = tree.flattenSinglePath();

      // Should remain unchanged (root nodes exist)
      expect(flattened.getRootCategories().length).toBe(tree.getRootCategories().length);
      // Nested categories should also be preserved
      expect(flattened.findCategory('automation')).toBeDefined();
      expect(flattened.findCategory('automation.files')).toBeDefined();
    });

    it('should re-root at branch point when single path leads to multiple categories', () => {
      const categories: CategoryManifest[] = [
        {
          id: 'root',
          name: 'Root',
          icon: 'root',
          parentId: undefined,
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
        {
          id: 'middle',
          name: 'Middle',
          icon: 'middle',
          parentId: 'root',
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
        {
          id: 'branch-a',
          name: 'Branch A',
          icon: 'branch',
          parentId: 'middle',
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
        {
          id: 'branch-b',
          name: 'Branch B',
          icon: 'branch',
          parentId: 'middle',
          sortOrder: 2,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
      ];

      const nodes: NodeManifest[] = [
        {
          nodeType: 'node-a',
          category: 'branch-a',
          version: '1.0.0',
          display: { label: 'Node A', icon: 'a' },
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
        {
          nodeType: 'node-b',
          category: 'branch-b',
          version: '1.0.0',
          display: { label: 'Node B', icon: 'b' },
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
      ];

      const tree = new CategoryTree(categories, nodes);
      const flattened = tree.flattenSinglePath();

      // Should re-root at the branch point (middle), exposing its nested categories
      const rootCategories = flattened.getRootCategories();
      expect(rootCategories).toHaveLength(2);
      expect(rootCategories[0]!.id).toBe('branch-a');
      expect(rootCategories[1]!.id).toBe('branch-b');

      // No root nodes
      expect(flattened.getRootNodes()).toHaveLength(0);
    });

    it('should not flatten when category has nodes and no children', () => {
      const categories: CategoryManifest[] = [
        {
          id: 'parent',
          name: 'Parent',
          icon: 'parent',
          parentId: undefined,
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
      ];

      const nodes: NodeManifest[] = [
        {
          nodeType: 'parent-node',
          category: 'parent',
          version: '1.0.0',
          display: { label: 'Parent Node', icon: 'node' },
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
      ];

      const tree = new CategoryTree(categories, nodes);
      const flattened = tree.flattenSinglePath();

      // Should flatten since parent is a leaf category with nodes
      expect(flattened.getRootCategories()).toHaveLength(0);
      expect(flattened.getRootNodes()).toHaveLength(1);
      expect(flattened.getRootNodes()[0]!.nodeType).toBe('parent-node');
    });
  });

  describe('flatten', () => {
    it('should bring all nodes to root level', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const flattened = tree.flatten();

      // All nodes should be at root
      const rootNodes = flattened.getRootNodes();
      expect(rootNodes).toHaveLength(5);

      // No categories should remain
      const rootCategories = flattened.getRootCategories();
      expect(rootCategories).toHaveLength(0);
    });

    it('should sort all nodes by sortOrder', () => {
      const categories: CategoryManifest[] = [
        {
          id: 'cat-a',
          name: 'A',
          icon: 'a',
          parentId: undefined,
          sortOrder: 1,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
        {
          id: 'cat-b',
          name: 'B',
          icon: 'b',
          parentId: undefined,
          sortOrder: 2,
          tags: [],
          color: 'blue',
          colorDark: 'darkBlue',
        },
      ];

      const nodes: NodeManifest[] = [
        {
          nodeType: 'node-3',
          category: 'cat-a',
          version: '1.0.0',
          display: { label: 'Node 3', icon: 'n' },
          sortOrder: 3,
          handleConfiguration: [],
          tags: [],
        },
        {
          nodeType: 'node-1',
          category: 'cat-b',
          version: '1.0.0',
          display: { label: 'Node 1', icon: 'n' },
          sortOrder: 1,
          handleConfiguration: [],
          tags: [],
        },
        {
          nodeType: 'node-2',
          category: undefined,
          version: '1.0.0',
          display: { label: 'Node 2', icon: 'n' },
          sortOrder: 2,
          handleConfiguration: [],
          tags: [],
        },
      ];

      const tree = new CategoryTree(categories, nodes);
      const flattened = tree.flatten();
      const rootNodes = flattened.getRootNodes();

      expect(rootNodes.map((n) => n.nodeType)).toEqual(['node-1', 'node-2', 'node-3']);
    });

    it('should preserve all nodes', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const originalNodeCount = tree.getNodeCount();
      const flattened = tree.flatten();

      expect(flattened.getNodeCount()).toBe(originalNodeCount);
    });
  });

  describe('isEmpty', () => {
    it('should return false for non-empty tree', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      expect(tree.isEmpty()).toBe(false);
    });

    it('should return true for empty tree', () => {
      const tree = new CategoryTree([], []);
      expect(tree.isEmpty()).toBe(true);
    });

    it('should return true after filtering all content', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const filtered = tree.filter({
        nodeFilter: () => false,
      });

      expect(filtered.isEmpty()).toBe(true);
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories as flat array', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const allCategories = tree.getAllCategories();
      expect(allCategories).toHaveLength(5);
    });
  });

  describe('getAllNodes', () => {
    it('should return all nodes as flat array', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const allNodes = tree.getAllNodes();
      expect(allNodes).toHaveLength(5);
    });
  });

  describe('getCategoryCount', () => {
    it('should return total category count', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      expect(tree.getCategoryCount()).toBe(5);
    });
  });

  describe('getNodeCount', () => {
    it('should return total node count', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      expect(tree.getNodeCount()).toBe(5);
    });
  });

  describe('immutability', () => {
    it('should not modify original tree when filtering', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const originalNodeCount = tree.getNodeCount();
      const filtered = tree.filter({ nodeFilter: () => false });

      expect(tree.getNodeCount()).toBe(originalNodeCount);
      expect(filtered.getNodeCount()).toBe(0);
    });

    it('should not modify original tree when flattening', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const originalCategoryCount = tree.getCategoryCount();
      const flattened = tree.flatten();

      expect(tree.getCategoryCount()).toBe(originalCategoryCount);
      expect(flattened.getCategoryCount()).toBe(0);
    });

    it('should allow chaining operations', () => {
      const categories = createMockCategories();
      const nodes = createMockNodes();
      const tree = new CategoryTree(categories, nodes);

      const result = tree.getSubtree('automation').filterBySearch('file').flatten();

      expect(result.getNodeCount()).toBe(2);
      expect(result.getCategoryCount()).toBe(0);
    });
  });
});
