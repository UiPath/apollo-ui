/**
 * Manifest Resolution Utilities
 *
 * Utilities for resolving node manifests with instance data to produce
 * final display and handle configurations for rendering.
 *
 * Key Concepts:
 * - Manifest: Static structure definition from server (NodeManifest)
 * - Instance Data: Runtime values from workflow node (WorkflowNode.display, WorkflowNode.inputs)
 * - Resolved: Final merged result used for rendering
 */

import type { HandleGroupManifest, HandleManifest } from '../schema/node-definition/handle';
import type { NodeDisplayManifest } from '../schema/node-definition/node-manifest';
import type { DisplayConfig } from '../schema/workflow/base';
import type { HandleActionEvent } from '../components/ButtonHandle/ButtonHandle';
import { getCollapsedShape } from './collapse';

/**
 * Context object passed to resolution functions
 */
export interface ResolutionContext {
  /** Instance display overrides */
  display?: DisplayConfig;
  /** Instance input values */
  inputs?: Record<string, unknown>;
  /** Node ID for collapse state lookup */
  nodeId?: string;
  isCollapsed?: boolean;
}

/**
 * Resolved display configuration (manifest defaults + instance overrides)
 * Uses DisplayConfig structure to allow any string values for flexibility
 */
export type ResolvedDisplay = DisplayConfig & {
  label: string;
  icon: string;
  description?: string;
  iconColor?: string;
  labelTooltip?: string;
  labelBackgroundColor?: string;
  centerAdornmentComponent?: React.ReactNode;
};

/**
 * Resolved handle with all templates replaced
 */
export interface ResolvedHandle extends Omit<HandleManifest, 'repeat' | 'itemVar' | 'indexVar'> {
  /** Resolved ID (templates replaced) */
  id: string;
  /** Resolved label (templates replaced) */
  label?: string;
  /** Whether the handle is currently visible */
  visible: boolean;
  /** Optional callback for button handle actions (runtime only) */
  onAction?: (event: HandleActionEvent) => void;
}

/**
 * Resolved handle group with expanded handles
 */
export interface ResolvedHandleGroup extends Omit<HandleGroupManifest, 'handles'> {
  /** Resolved handles (repeat expanded, templates replaced) */
  handles: ResolvedHandle[];
}

/**
 * Template variable context for replacement
 */
interface TemplateVars {
  [key: string]: unknown;
  item?: unknown;
  index?: number;
}

/**
 * Resolve display configuration by merging manifest defaults with instance overrides.
 *
 * @param manifestDisplay - Display defaults from NodeManifest
 * @param instanceDisplay - Display overrides from WorkflowNode.display
 * @returns Merged display configuration
 *
 * @example
 * ```typescript
 * const display = resolveDisplay(
 *   { label: "Decision", icon: "git-branch", shape: "square" },
 *   { display: { label: "Check if admin" } },
 * );
 * // Result: { label: "Check if admin", icon: "git-branch", shape: "square" }
 * ```
 */
export function resolveDisplay(
  manifestDisplay?: NodeDisplayManifest,
  context?: ResolutionContext
): ResolvedDisplay {
  if (!manifestDisplay) {
    return {
      icon: 'help-circle',
      shape: 'square' as const,
      label: context?.display?.label || 'Unknown Node',
    } as ResolvedDisplay;
  }

  const isCollapsed = context?.isCollapsed ?? false;
  const shape = context?.display?.shape ?? manifestDisplay.shape;

  const collapsedShape = getCollapsedShape(shape);
  const expandedShape = manifestDisplay.shape;

  return {
    ...manifestDisplay,
    ...context?.display,
    shape: isCollapsed ? collapsedShape : expandedShape,
  };
}

/**
 * Resolve visibility for a handle based on manifest configuration.
 *
 * Visibility can be:
 * - Boolean literal: true/false
 * - String property path: "hasDefault" → node.inputs.hasDefault
 * - Undefined (defaults to true)
 *
 * @param visible - Visibility configuration from HandleManifest
 * @param context - Resolution context with inputs
 * @returns Whether the handle should be visible
 *
 * @example
 * ```typescript
 * // Literal boolean
 * resolveVisibility(true, context); // true
 *
 * // Property path lookup
 * resolveVisibility("hasDefault", { inputs: { hasDefault: false } }); // false
 *
 * // Nested path
 * resolveVisibility("config.advanced.enabled", { inputs: { config: { advanced: { enabled: true } } } }); // true
 *
 * // Undefined defaults to true
 * resolveVisibility(undefined, context); // true
 * ```
 */
export function resolveVisibility(
  visible: boolean | string | undefined,
  context: ResolutionContext
): boolean {
  // Undefined defaults to true
  if (visible === undefined) {
    return true;
  }

  // Boolean literal
  if (typeof visible === 'boolean') {
    return visible;
  }

  // String property path - look up in inputs
  if (typeof visible === 'string') {
    const value = getPropertyByPath(context.inputs || {}, visible);
    return Boolean(value);
  }

  // Fallback to true
  return true;
}

/**
 * Replace template variables in a string with actual values.
 *
 * Supports:
 * - {index} - Current array index (0-based)
 * - {item} - Current array item (toString)
 * - {item.property} - Access item properties
 * - {customVar} - Custom variable from vars object
 * - {customVar.nested.prop} - Nested property access
 *
 * @param template - Template string with {variable} placeholders
 * @param vars - Variables to replace
 * @returns String with all templates replaced
 *
 * @example
 * ```typescript
 * replaceTemplateVars("case-{index}", { index: 0 });
 * // Result: "case-0"
 *
 * replaceTemplateVars("Case {index}: {item.label}", {
 *   index: 1,
 *   item: { label: "Success" }
 * });
 * // Result: "Case 1: Success"
 *
 * replaceTemplateVars("{status.name} - {status.code}", {
 *   status: { name: "Active", code: 200 }
 * });
 * // Result: "Active - 200"
 * ```
 */
export function replaceTemplateVars(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, path: string) => {
    const value = getPropertyByPath(vars, path);
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Resolve handle configurations by expanding repeat expressions and replacing templates.
 *
 * For each handle:
 * - If `repeat` is defined: Expands into multiple handles from array data
 * - If static: Returns as-is with visibility resolved
 * - Templates in `id` and `label` are replaced with actual values
 *
 * @param handleGroups - Handle group manifests from NodeManifest
 * @param context - Resolution context with inputs
 * @returns Resolved handle groups with expanded handles
 *
 * @example
 * ```typescript
 * // Static handle (no repeat)
 * const staticGroups = resolveHandles([{
 *   position: "top",
 *   handles: [{ id: "in", type: "target", handleType: "input" }]
 * }], context);
 * // Result: Same structure, visibility resolved
 *
 * // Dynamic handles (with repeat)
 * const dynamicGroups = resolveHandles([{
 *   position: "bottom",
 *   handles: [{
 *     id: "case-{index}",
 *     type: "source",
 *     handleType: "output",
 *     label: "Case {index}: {item.label}",
 *     repeat: "cases",
 *     itemVar: "item",
 *     indexVar: "index"
 *   }]
 * }], { inputs: { cases: [{ label: "Success" }, { label: "Failure" }] } });
 * // Result: Two handles - "case-0" (Case 0: Success), "case-1" (Case 1: Failure)
 * ```
 */
export function resolveHandles(
  handleGroups: HandleGroupManifest[],
  context: ResolutionContext
): ResolvedHandleGroup[] {
  const isCollapsed = context?.isCollapsed ?? false;

  return handleGroups.map((group) => {
    const handles: ResolvedHandle[] = group.handles.flatMap((handle) => {
      // Handle repeat (dynamic handles from array)
      if (handle.repeat) {
        const array = getPropertyByPath(context.inputs || {}, handle.repeat);

        // If repeat expression doesn't resolve to an array, return empty
        if (!Array.isArray(array)) {
          console.warn(
            `Repeat expression "${handle.repeat}" did not resolve to an array. Skipping handle.`
          );
          return [];
        }

        // Variable names (defaults: item, index)
        const itemVar = handle.itemVar || 'item';
        const indexVar = handle.indexVar || 'index';

        // Generate one handle per array item
        return array.map((item, index) => {
          const vars: TemplateVars = {
            [itemVar]: item,
            [indexVar]: index,
          };

          // Hide artifact handles when node is collapsed
          const baseVisible = resolveVisibility(handle.visible, context);
          const isArtifactHandle = handle.handleType === 'artifact';
          const visible = context.isCollapsed && isArtifactHandle ? false : baseVisible;

          return {
            ...handle,
            id: replaceTemplateVars(handle.id, vars),
            label: handle.label ? replaceTemplateVars(handle.label, vars) : undefined,
            visible,
            // Remove repeat-specific fields
            repeat: undefined,
            itemVar: undefined,
            indexVar: undefined,
          } as ResolvedHandle;
        });
      }

      // Static handle (no repeat)
      // Hide artifact handles when node is collapsed
      const baseVisible = resolveVisibility(handle.visible, context);
      const isArtifactHandle = handle.handleType === 'artifact';
      const visible = isCollapsed && isArtifactHandle ? false : baseVisible;

      return {
        ...handle,
        visible,
      } as ResolvedHandle;
    });

    return {
      ...group,
      handles,
    };
  });
}

/**
 * Get a property value by dot-notation path.
 *
 * @param obj - Object to traverse
 * @param path - Dot-notation path (e.g., "config.advanced.enabled")
 * @returns Value at path, or undefined if not found
 *
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: "John" } } };
 * getPropertyByPath(obj, "user.profile.name"); // "John"
 * getPropertyByPath(obj, "user.age"); // undefined
 * getPropertyByPath(obj, "invalid.path.here"); // undefined
 * ```
 */
function getPropertyByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}
