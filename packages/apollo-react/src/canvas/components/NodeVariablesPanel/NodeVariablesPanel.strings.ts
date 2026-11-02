import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import type { NodeVariablesPanelStrings } from './NodeVariablesPanel.types';

/**
 * The panel's copy from the canvas catalog, with the host's overrides on top.
 * An `undefined` override keeps the default, as in the tree's strings.
 */
export function useNodeVariablesPanelStrings(
  overrides: Partial<NodeVariablesPanelStrings> | undefined
): NodeVariablesPanelStrings {
  const { _ } = useSafeLingui();
  return useMemo(
    () => ({
      sectionInputs: _({ id: 'canvas.node_variables_panel.section_inputs', message: 'Inputs' }),
      sectionOutputs: _({ id: 'canvas.node_variables_panel.section_outputs', message: 'Outputs' }),
      sectionVariables: _({
        id: 'canvas.node_variables_panel.section_variables',
        message: 'Variables',
      }),
      sectionAssets: _({ id: 'canvas.node_variables_panel.section_assets', message: 'Assets' }),
      sectionNodes: _({ id: 'canvas.node_variables_panel.section_nodes', message: 'Nodes' }),
      inputsCount: (count) =>
        _({
          id: 'canvas.node_variables_panel.count_inputs',
          message: 'Inputs: {count}',
          values: { count },
        }),
      outputsCount: (count) =>
        _({
          id: 'canvas.node_variables_panel.count_outputs',
          message: 'Outputs: {count}',
          values: { count },
        }),
      variablesCount: (count) =>
        _({
          id: 'canvas.node_variables_panel.count_variables',
          message: 'Variables: {count}',
          values: { count },
        }),
      assetsCount: (count) =>
        _({
          id: 'canvas.node_variables_panel.count_assets',
          message: 'Assets: {count}',
          values: { count },
        }),
      nodesCount: (count) =>
        _({
          id: 'canvas.node_variables_panel.count_nodes',
          message: 'Nodes: {count}',
          values: { count },
        }),
      addOutputs: _({ id: 'canvas.node_variables_panel.add_outputs', message: 'Add outputs' }),
      addVariables: _({
        id: 'canvas.node_variables_panel.add_variables',
        message: 'Add variables',
      }),
      addAssets: _({ id: 'canvas.node_variables_panel.add_assets', message: 'Add asset' }),
      nodeOutputCount: (count) =>
        _({
          id: 'canvas.node_variables_panel.node_output_count',
          message: 'Outputs: {count}',
          values: { count },
        }),
      addToNode: _({ id: 'canvas.node_variables_panel.add_to_node', message: 'Add' }),
      addFromNode: (label) =>
        _({
          id: 'canvas.node_variables_panel.add_to_node_label',
          message: 'Add from {label}',
          values: { label },
        }),
      focusNode: _({ id: 'canvas.node_variables_panel.focus_node', message: 'Focus on node' }),
      focusNodeLabel: (label) =>
        _({
          id: 'canvas.node_variables_panel.focus_node_label',
          message: 'Focus on {label}',
          values: { label },
        }),
      editVariable: (name) =>
        _({
          id: 'canvas.node_variables_panel.edit_variable',
          message: 'Edit {name}',
          values: { name },
        }),
      deleteVariable: (name) =>
        _({
          id: 'canvas.node_variables_panel.delete_variable',
          message: 'Delete {name}',
          values: { name },
        }),
      searchPlaceholder: _({
        id: 'canvas.node_variables_panel.search_placeholder',
        message: 'Search variables',
      }),
      noMatches: _({
        id: 'canvas.node_variables_panel.no_matches',
        message: 'No variables match your search.',
      }),
      filterEmpty: _({
        id: 'canvas.node_variables_panel.filter_empty',
        message: 'No variables match this filter.',
      }),
      ...Object.fromEntries(
        Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined)
      ),
    }),
    [_, overrides]
  );
}
