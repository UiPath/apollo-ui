import { describe, expect, it } from 'vitest';
import type { ConnectionConstraint, HandleTarget } from '../schema/node-definition/constraints';
import {
  type ConnectionValidationContext,
  canAcceptMoreConnections,
  checkCategoryConstraint,
  meetsMinimumConnections,
  validateConnection,
} from './constraint-validator';

describe('constraint-validator', () => {
  describe('checkCategoryConstraint', () => {
    it('should allow category when no constraints specified', () => {
      expect(checkCategoryConstraint('automation')).toBe(true);
      expect(checkCategoryConstraint('data')).toBe(true);
    });

    it('should allow category when in allowedCategories list', () => {
      expect(checkCategoryConstraint('automation', ['automation', 'data'])).toBe(true);
    });

    it('should reject category when not in allowedCategories list', () => {
      expect(checkCategoryConstraint('other', ['automation', 'data'])).toBe(false);
    });

    it('should reject category when in forbiddenCategories list', () => {
      expect(checkCategoryConstraint('automation', undefined, ['automation'])).toBe(false);
    });

    it('should allow category when not in forbiddenCategories list', () => {
      expect(checkCategoryConstraint('data', undefined, ['automation'])).toBe(true);
    });

    it('should reject when category is undefined and constraints exist', () => {
      expect(checkCategoryConstraint(undefined, ['automation'])).toBe(false);
      expect(checkCategoryConstraint(undefined, undefined, ['automation'])).toBe(false);
    });

    it('should allow when category is undefined and no constraints exist', () => {
      expect(checkCategoryConstraint(undefined)).toBe(true);
    });

    it('should prioritize forbidden over allowed', () => {
      expect(checkCategoryConstraint('automation', ['automation'], ['automation'])).toBe(false);
    });
  });

  describe('validateConnection', () => {
    it('should allow connection between compatible output and input', () => {
      const context: ConnectionValidationContext = {
        sourceNode: { type: 'trigger', category: 'control-flow' },
        sourceHandle: { id: 'output', handleType: 'source' },
        targetNode: { type: 'action', category: 'automation' },
        targetHandle: { id: 'input', handleType: 'target' },
      };

      const result = validateConnection(context);
      expect(result.valid).toBe(true);
    });

    it('should reject connection between same handle types', () => {
      const context: ConnectionValidationContext = {
        sourceNode: { type: 'trigger', category: 'control-flow' },
        sourceHandle: { id: 'output', handleType: 'source' },
        targetNode: { type: 'action', category: 'automation' },
        targetHandle: { id: 'output', handleType: 'source' },
      };

      const result = validateConnection(context);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot connect source to source');
    });

    it('should allow artifact-to-artifact connections', () => {
      const context: ConnectionValidationContext = {
        sourceNode: { type: 'model', category: 'ai' },
        sourceHandle: { id: 'model-artifact', handleType: 'artifact' },
        targetNode: { type: 'agent', category: 'ai' },
        targetHandle: { id: 'model-input', handleType: 'artifact' },
      };

      const result = validateConnection(context);
      expect(result.valid).toBe(true);
    });

    describe('allowedTargets constraints', () => {
      it('should allow connection when target is in allowedTargets', () => {
        const allowedTargets: HandleTarget[] = [{ nodeType: 'action' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargets },
          },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should reject connection when target is not in allowedTargets', () => {
        const allowedTargets: HandleTarget[] = [{ nodeType: 'action' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargets },
          },
          targetNode: { type: 'other', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('cannot connect to');
      });

      it('should support wildcard node type patterns', () => {
        const allowedTargets: HandleTarget[] = [{ nodeType: 'automation.*' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargets },
          },
          targetNode: { type: 'automation.file', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should support universal wildcard', () => {
        const allowedTargets: HandleTarget[] = [{ nodeType: '*' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargets },
          },
          targetNode: { type: 'anything', category: 'any' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should match specific handle IDs when specified', () => {
        const allowedTargets: HandleTarget[] = [{ nodeType: 'agent', handleId: 'model' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'model', category: 'ai' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargets },
          },
          targetNode: { type: 'agent', category: 'ai' },
          targetHandle: { id: 'model', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should reject when handle ID does not match', () => {
        const allowedTargets: HandleTarget[] = [{ nodeType: 'agent', handleId: 'model' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'model', category: 'ai' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargets },
          },
          targetNode: { type: 'agent', category: 'ai' },
          targetHandle: { id: 'other-input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
      });
    });

    describe('forbiddenTargets constraints', () => {
      it('should reject connection when target is in forbiddenTargets', () => {
        const forbiddenTargets: HandleTarget[] = [{ nodeType: 'unsafe-action' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { forbiddenTargets },
          },
          targetNode: { type: 'unsafe-action', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
      });

      it('should allow connection when target is not in forbiddenTargets', () => {
        const forbiddenTargets: HandleTarget[] = [{ nodeType: 'unsafe-action' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { forbiddenTargets },
          },
          targetNode: { type: 'safe-action', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });
    });

    describe('allowedTargetCategories constraints', () => {
      it('should allow connection when target category is allowed', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargetCategories: ['automation'] },
          },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should reject connection when target category is not allowed', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { allowedTargetCategories: ['automation'] },
          },
          targetNode: { type: 'action', category: 'data' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Cannot connect to nodes in category');
      });
    });

    describe('forbiddenTargetCategories constraints', () => {
      it('should reject connection when target category is forbidden', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { forbiddenTargetCategories: ['unsafe'] },
          },
          targetNode: { type: 'action', category: 'unsafe' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
      });

      it('should allow connection when target category is not forbidden', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: { forbiddenTargetCategories: ['unsafe'] },
          },
          targetNode: { type: 'action', category: 'safe' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });
    });

    describe('allowedSources constraints', () => {
      it('should allow connection when source is in allowedSources', () => {
        const allowedSources: HandleTarget[] = [{ nodeType: 'trigger' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { allowedSources },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should reject connection when source is not in allowedSources', () => {
        const allowedSources: HandleTarget[] = [{ nodeType: 'trigger' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'other', category: 'control-flow' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { allowedSources },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('cannot accept connections from');
      });
    });

    describe('forbiddenSources constraints', () => {
      it('should reject connection when source is in forbiddenSources', () => {
        const forbiddenSources: HandleTarget[] = [{ nodeType: 'unsafe-trigger' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'unsafe-trigger', category: 'control-flow' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { forbiddenSources },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
      });

      it('should allow connection when source is not in forbiddenSources', () => {
        const forbiddenSources: HandleTarget[] = [{ nodeType: 'unsafe-trigger' }];

        const context: ConnectionValidationContext = {
          sourceNode: { type: 'safe-trigger', category: 'control-flow' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { forbiddenSources },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });
    });

    describe('allowedSourceCategories constraints', () => {
      it('should allow connection when source category is allowed', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { allowedSourceCategories: ['control-flow'] },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should reject connection when source category is not allowed', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'other' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { allowedSourceCategories: ['control-flow'] },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Cannot accept connections from nodes in category');
      });
    });

    describe('forbiddenSourceCategories constraints', () => {
      it('should reject connection when source category is forbidden', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'unsafe' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { forbiddenSourceCategories: ['unsafe'] },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
      });

      it('should allow connection when source category is not forbidden', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'safe' },
          sourceHandle: { id: 'output', handleType: 'source' },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: { forbiddenSourceCategories: ['unsafe'] },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });
    });

    describe('combined constraints', () => {
      it('should pass when all constraints are satisfied', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: {
              allowedTargets: [{ nodeType: 'action' }],
              allowedTargetCategories: ['automation'],
            },
          },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: {
            id: 'input',
            handleType: 'target',
            constraints: {
              allowedSources: [{ nodeType: 'trigger' }],
              allowedSourceCategories: ['control-flow'],
            },
          },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(true);
      });

      it('should fail when any constraint is violated', () => {
        const context: ConnectionValidationContext = {
          sourceNode: { type: 'trigger', category: 'control-flow' },
          sourceHandle: {
            id: 'output',
            handleType: 'source',
            constraints: {
              allowedTargets: [{ nodeType: 'action' }],
              allowedTargetCategories: ['data'], // Mismatch
            },
          },
          targetNode: { type: 'action', category: 'automation' },
          targetHandle: { id: 'input', handleType: 'target' },
        };

        const result = validateConnection(context);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('canAcceptMoreConnections', () => {
    it('should return true when no maxConnections constraint', () => {
      const handle = { constraints: {} };
      expect(canAcceptMoreConnections(handle, 5)).toBe(true);
    });

    it('should return true when below max connections', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { maxConnections: 3 },
      };
      expect(canAcceptMoreConnections(handle, 2)).toBe(true);
    });

    it('should return false when at max connections', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { maxConnections: 3 },
      };
      expect(canAcceptMoreConnections(handle, 3)).toBe(false);
    });

    it('should return false when above max connections', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { maxConnections: 3 },
      };
      expect(canAcceptMoreConnections(handle, 4)).toBe(false);
    });

    it('should handle single connection limit', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { maxConnections: 1 },
      };
      expect(canAcceptMoreConnections(handle, 0)).toBe(true);
      expect(canAcceptMoreConnections(handle, 1)).toBe(false);
    });
  });

  describe('meetsMinimumConnections', () => {
    it('should return true when no minConnections constraint', () => {
      const handle = { constraints: {} };
      expect(meetsMinimumConnections(handle, 0)).toBe(true);
    });

    it('should return true when at or above min connections', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { minConnections: 2 },
      };
      expect(meetsMinimumConnections(handle, 2)).toBe(true);
      expect(meetsMinimumConnections(handle, 3)).toBe(true);
    });

    it('should return false when below min connections', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { minConnections: 2 },
      };
      expect(meetsMinimumConnections(handle, 1)).toBe(false);
      expect(meetsMinimumConnections(handle, 0)).toBe(false);
    });

    it('should handle zero min connections', () => {
      const handle: { constraints: ConnectionConstraint } = {
        constraints: { minConnections: 0 },
      };
      expect(meetsMinimumConnections(handle, 0)).toBe(true);
    });
  });
});
