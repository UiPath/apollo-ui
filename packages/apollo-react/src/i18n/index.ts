export type { ApI18nProviderProps, SupportedLocale } from './ApI18nProvider';
export { ApI18nProvider, SUPPORTED_LOCALES, useApI18n } from './ApI18nProvider';
// Sync accessor over the pre-imported catalogs — for hosts that merge component
// messages into their own lingui singleton (the loadModelPickerMessages pattern)
// instead of mounting ApI18nProvider.
export { getPreImportedMessages } from './locale-registry';
export { useSafeLingui } from './useSafeLingui';
