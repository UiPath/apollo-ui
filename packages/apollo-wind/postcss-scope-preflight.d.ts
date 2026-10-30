import type { Plugin, PluginCreator } from 'postcss';

export interface ScopePreflightOptions {
  /**
   * Selectors for the elements that own the consumer's DOM: web-component tags, portal markers,
   * `[data-slot]`. Preflight applies to these elements and their descendants.
   */
  roots: string[];
  /**
   * Preflight's `html, :host` rule sets the page font from `--font-sans`, a `:root` variable every
   * consumer in a shared document redefines. By default the font declarations stay on the outermost
   * root. Pass the selector of the element the consumer renders when it owns the whole document to
   * apply them there only, so embedded roots inherit the host's font; pass `false` to drop them.
   */
  documentRoot?: string | false;
}

/** Inserts `:where(:scope)` into the subject of a selector, ahead of any pseudo-element. */
export function scopeSelector(selector: string): string;

declare const scopePreflight: PluginCreator<ScopePreflightOptions> &
  ((options: ScopePreflightOptions) => Plugin);
export default scopePreflight;
