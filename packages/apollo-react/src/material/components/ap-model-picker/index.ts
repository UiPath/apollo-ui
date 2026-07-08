// Main component. `ApModelPicker` is the conventional Ap-prefixed name
// in this package; `ModelPicker` is kept as the canonical export.

export type { ModelBadgeDefinition, ModelBadgeKind } from './badges';
// Badge pool
export { MODEL_BADGES } from './badges';

// i18n contract
export type { PickerTranslator } from './i18n';
export type {
  ModelPickerChangeHandler,
  ModelPickerProps,
  ModelPickerSlotContext,
  ModelPickerSlots,
  ModelPickerVariant,
} from './ModelPicker';
export { ModelPicker, ModelPicker as ApModelPicker } from './ModelPicker';
export type { ModelTagChipProps } from './ModelTagChip';
// Tag chip
export { ModelTagChip } from './ModelTagChip';
export type {
  FolderSwitcherFolder,
  FolderSwitcherProps,
} from './primitives/FolderSwitcher';
// Primitives — exported so teams can compose their own pickers without forking.
export { FolderSwitcher } from './primitives/FolderSwitcher';
export type { GroupHeaderProps } from './primitives/GroupHeader';
export { GroupHeader } from './primitives/GroupHeader';
export type { ModelOptionRowProps } from './primitives/ModelOptionRow';
export { defaultRowActions, ModelOptionRow } from './primitives/ModelOptionRow';
export type { AnnotatedModel, OptionListProps } from './primitives/OptionList';
export { GroupedOptionList, VirtualOptionList } from './primitives/OptionList';
export type { PickerPopupProps } from './primitives/PickerPopup';
export { PickerPopup } from './primitives/PickerPopup';
export type { PickerSearchInputProps } from './primitives/PickerSearchInput';
export { PickerSearchInput } from './primitives/PickerSearchInput';
export type { PickerTriggerProps } from './primitives/PickerTrigger';
export { PickerTrigger } from './primitives/PickerTrigger';
// Types
export type {
  ByomDetails,
  CostTier,
  DeprecationDetails,
  DiscoveryModel,
  DiscoveryRequestContext,
  ModelCostDetails,
  ModelDetails,
  ModelGeography,
  ModelGroup,
  ModelSubscriptionType,
  ModelTag,
  ModelTagKind,
  ModelVendor,
  RoutingDetails,
} from './types';
export type { UseDiscoveryModelsResult } from './useDiscoveryModels';
// Data hooks
export { useDiscoveryModels } from './useDiscoveryModels';
export type {
  UseModelPickerStateOptions,
  UseModelPickerStateResult,
} from './useModelPickerState';
// State controller (for teams building custom pickers from the primitives)
export { useModelPickerState } from './useModelPickerState';
export type {
  PlatformRequestContext,
  UseCanManageByoResult,
  UseUserFoldersResult,
} from './usePlatformAccess';
export { useCanManageByo, useUserFolders } from './usePlatformAccess';
export type {
  DeriveModelTagsContext,
  GroupModelsContext,
  GroupStrategy,
} from './utils';
// Utilities
export {
  defaultCostTier,
  deriveModelTags,
  filterModels,
  getSubstitutionTarget,
  groupModels,
} from './utils';
