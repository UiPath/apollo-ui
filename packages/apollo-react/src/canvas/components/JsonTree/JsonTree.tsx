import {
  JsonContainerEditor as WindJsonContainerEditor,
  JsonLeafValueEditor as WindJsonLeafValueEditor,
  JsonMultilineLeafEditor as WindJsonMultilineLeafEditor,
  JsonTreeToolbar as WindJsonTreeToolbar,
  JsonTreeView as WindJsonTreeView,
  type JsonTreeViewProps,
  JsonTreeViewProvider as WindJsonTreeViewProvider,
  type JsonTreeViewProviderProps,
  type JsonTreeViewStrings,
  JsonTypeBadge as WindJsonTypeBadge,
} from '@uipath/apollo-wind';
import { type ComponentType, createContext, useContext, useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

/**
 * Tooltips must clear the canvas's floating panels, which stack above
 * apollo-wind's default tooltip layer (matches `CanvasTooltip`). Important, so
 * a caller's own `tooltipContentClassName` (e.g. `z-50`) can add classes but
 * never drop the tooltip back under the panels.
 */
const CANVAS_TOOLTIP_CLASS = 'z-1200!';

/**
 * The Json tree view's strings, translated through the canvas catalog. The
 * message ids predate the move to apollo-wind, so existing translations apply.
 */
export function useCanvasJsonTreeViewStrings(): JsonTreeViewStrings {
  const { _ } = useSafeLingui();
  return useMemo(
    () => ({
      arrayItem: _({ id: 'canvas.json_value_panel.array_item', message: 'item' }),
      emptySearch: _({
        id: 'canvas.json_value_panel.empty_search',
        message: 'No fields match your search.',
      }),
      emptyDefault: _({
        id: 'canvas.json_value_panel.empty_default',
        message: 'No fields to display.',
      }),
      expandKey: (key) =>
        _({ id: 'canvas.json_value_panel.expand_key', message: 'Expand {key}', values: { key } }),
      collapseKey: (key) =>
        _({
          id: 'canvas.json_value_panel.collapse_key',
          message: 'Collapse {key}',
          values: { key },
        }),
      itemCount: (count) =>
        _({
          id: 'canvas.json_value_panel.item_count',
          message: '{count, plural, one {# item} other {# items}}',
          values: { count },
        }),
      keyCount: (count) =>
        _({
          id: 'canvas.json_value_panel.key_count',
          message: '{count, plural, one {# key} other {# keys}}',
          values: { count },
        }),
      requiredMarker: _({ id: 'canvas.json_value_panel.required_marker', message: 'required' }),
      referenceType: (typeLabel) =>
        _({
          id: 'canvas.json_value_panel.reference_type',
          message: '{typeLabel} · reference',
          values: { typeLabel },
        }),
      pathCopied: _({ id: 'canvas.json_value_panel.path_copied', message: 'Path copied' }),
      copyPathHint: _({
        id: 'canvas.json_value_panel.copy_path_hint',
        message: 'Click to copy this path',
      }),
      copyPathFor: (path) =>
        _({
          id: 'canvas.json_value_panel.copy_path_for',
          message: 'Copy path for {path}',
          values: { path },
        }),
      wrapValue: _({ id: 'canvas.json_value_panel.wrap_value', message: 'Wrap value' }),
      unwrapValue: _({ id: 'canvas.json_value_panel.unwrap_value', message: 'Unwrap value' }),
      wrapValueOf: (key) =>
        _({
          id: 'canvas.json_value_panel.wrap_value_of',
          message: 'Wrap value of {key}',
          values: { key },
        }),
      unwrapValueOf: (key) =>
        _({
          id: 'canvas.json_value_panel.unwrap_value_of',
          message: 'Unwrap value of {key}',
          values: { key },
        }),
      editAsJson: _({ id: 'canvas.json_value_panel.edit_as_json', message: 'Edit as JSON' }),
      editKeyAsJson: (key) =>
        _({
          id: 'canvas.json_value_panel.edit_key_as_json',
          message: 'Edit {key} as JSON',
          values: { key },
        }),
      copyValue: _({ id: 'canvas.json_value_panel.copy_value', message: 'Copy value' }),
      copyValueOf: (key) =>
        _({
          id: 'canvas.json_value_panel.copy_value_of',
          message: 'Copy value of {key}',
          values: { key },
        }),
      moreActions: _({ id: 'canvas.json_value_panel.more_actions', message: 'More actions' }),
      unsetValue: _({ id: 'canvas.json_value_panel.unset_value', message: 'unset' }),
      editValueOf: (key) =>
        _({
          id: 'canvas.json_value_panel.edit_value_of',
          message: 'Edit value of {key}',
          values: { key },
        }),
      editJsonOf: (key) =>
        _({
          id: 'canvas.json_value_panel.edit_json_of',
          message: 'Edit JSON of {key}',
          values: { key },
        }),
      editHint: _({ id: 'canvas.json_value_panel.edit_hint', message: 'Click to edit' }),
      toggleHint: _({ id: 'canvas.json_value_panel.toggle_hint', message: 'Click to toggle' }),
      unsetEditHint: _({
        id: 'canvas.json_value_panel.unset_edit_hint',
        message: 'Click to set a value',
      }),
      enterNumber: _({ id: 'canvas.json_value_panel.enter_number', message: 'Enter a number' }),
      enterValue: _({ id: 'canvas.json_value_panel.enter_value', message: 'Enter a value' }),
      invalidJson: _({ id: 'canvas.json_value_panel.invalid_json', message: 'Invalid JSON' }),
      apply: _({ id: 'canvas.json_value_panel.apply', message: 'Apply' }),
      cancel: _({ id: 'canvas.json_value_panel.cancel', message: 'Cancel' }),
      searchFields: _({
        id: 'canvas.json_value_panel.search_fields',
        message: 'Search fields and values...',
      }),
      searchFieldsAction: _({
        id: 'canvas.json_value_panel.search_fields_action',
        message: 'Search fields and values',
      }),
      clearSearch: _({ id: 'canvas.json_value_panel.clear_search', message: 'Clear search' }),
      filter: _({ id: 'canvas.json_value_panel.filter', message: 'Filter' }),
      filterActive: (label) =>
        _({
          id: 'canvas.json_value_panel.filter_active',
          message: 'Filter: {label}',
          values: { label },
        }),
      filterAll: _({ id: 'canvas.json_value_panel.filter_all', message: 'All' }),
      expandAll: _({ id: 'canvas.json_value_panel.expand_all', message: 'Expand all' }),
      collapseAll: _({ id: 'canvas.json_value_panel.collapse_all', message: 'Collapse all' }),
    }),
    [_]
  );
}

const InsideCanvasProviderContext = createContext(false);

/**
 * Canvas version of apollo-wind's `JsonTreeViewProvider`: the canvas catalog's
 * translations and tooltip layer are the base, and `strings` /
 * `tooltipContentClassName` apply on top. Every Json tree part below it
 * (including the standalone editors and toolbar) uses the result, so this is
 * how to override strings for parts that have no `strings` prop of their own.
 */
export function JsonTreeViewProvider({
  strings,
  tooltipContentClassName,
  children,
}: JsonTreeViewProviderProps) {
  const insideCanvasProvider = useContext(InsideCanvasProviderContext);
  const canvasStrings = useCanvasJsonTreeViewStrings();
  const overrides = (
    <WindJsonTreeViewProvider strings={strings} tooltipContentClassName={tooltipContentClassName}>
      <InsideCanvasProviderContext.Provider value={true}>
        {children}
      </InsideCanvasProviderContext.Provider>
    </WindJsonTreeViewProvider>
  );
  // Nested: the outer canvas provider already laid down the translations, so
  // only add this level's overrides on top of whatever is inherited.
  if (insideCanvasProvider) return overrides;
  return (
    <WindJsonTreeViewProvider
      strings={canvasStrings}
      tooltipContentClassName={CANVAS_TOOLTIP_CLASS}
    >
      {overrides}
    </WindJsonTreeViewProvider>
  );
}

function withCanvasStrings<P extends object>(Component: ComponentType<P>, name: string) {
  const Wrapped = (props: P) => {
    // Inside a canvas provider the translations (and any overrides on top of
    // them) are already in place; supplying them again would overwrite those
    // overrides.
    const insideCanvasProvider = useContext(InsideCanvasProviderContext);
    if (insideCanvasProvider) return <Component {...props} />;
    return (
      <JsonTreeViewProvider>
        <Component {...props} />
      </JsonTreeViewProvider>
    );
  };
  Wrapped.displayName = name;
  return Wrapped;
}

/**
 * apollo-wind's `JsonTreeView` with canvas translations. A `strings` prop still
 * overrides individual strings.
 */
export const JsonTreeView = withCanvasStrings(WindJsonTreeView, 'JsonTreeView');
export const JsonTreeToolbar = withCanvasStrings(WindJsonTreeToolbar, 'JsonTreeToolbar');
export const JsonContainerEditor = withCanvasStrings(
  WindJsonContainerEditor,
  'JsonContainerEditor'
);
export const JsonLeafValueEditor = withCanvasStrings(
  WindJsonLeafValueEditor,
  'JsonLeafValueEditor'
);
export const JsonMultilineLeafEditor = withCanvasStrings(
  WindJsonMultilineLeafEditor,
  'JsonMultilineLeafEditor'
);
/** Canvas tooltip layer only; the badge has no strings of its own. */
export const JsonTypeBadge = withCanvasStrings(WindJsonTypeBadge, 'JsonTypeBadge');

/** @deprecated Use `JsonTreeViewProps`. */
export type JsonTreeProps = JsonTreeViewProps;
/** @deprecated Use `JsonTreeView`. */
export const JsonTree = JsonTreeView;
