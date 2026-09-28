// Deprecated compatibility entry.
//
// The icon set now lives in @uipath/apollo-ui-icons. This re-export keeps
// `@uipath/apollo-core/icons` working for existing consumers and will be
// removed in the next major. Import from @uipath/apollo-ui-icons directly.
//
// Bundleless output leaves the bare specifier external, so nothing from the
// icon package is bundled here and no webpack runtime is emitted.
export * from '@uipath/apollo-ui-icons';
