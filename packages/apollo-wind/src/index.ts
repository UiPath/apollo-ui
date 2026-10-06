// =============================================================================
// @uipath/apollo-wind - Public API Exports
// =============================================================================

export type {
  AdapterRequest,
  AdapterResponse,
  DataAdapter,
} from './components/forms/data-fetcher';
export {
  DataFetcher,
  DataSourceBuilder,
  DataTransformers,
  FetchAdapter,
} from './components/forms/data-fetcher';
export type {
  AiAssistActionOptions,
  ClearActionOptions,
  FieldActionContext,
  FieldActionGenerate,
  FieldActionRegistry,
  FieldActionsPluginConfig,
  FieldHeaderAction,
  FieldMenuAction,
  InsertVariableActionOptions,
  ValueModeVariable,
} from './components/forms/field-actions';
export {
  createAiAssistAction,
  createClearAction,
  createInsertVariableAction,
  resolveVariables,
} from './components/forms/field-actions';
export type {
  FieldControlFormField,
  FieldControlGeometry,
  FieldControlLabelTarget,
  FieldControlProps,
} from './components/forms/field-control';
export { FIELD_CONTROL_GEOMETRY, FieldControl } from './components/forms/field-control';
export { FormFieldRenderer } from './components/forms/field-renderer';
export { FormDesigner } from './components/forms/form-designer';
export {
  analyticsPlugin,
  auditPlugin,
  autoSavePlugin,
  formattingPlugin,
  validationPlugin,
  workflowPlugin,
} from './components/forms/form-plugins';
export type {
  CustomComponents,
  CustomFieldComponentProps,
  CustomValueType,
  DataSource,
  FieldCondition,
  FieldMetadata,
  FieldOption,
  FieldRule,
  FieldType,
  FormAction,
  FormContext,
  FormPlugin,
  FormSchema,
  FormSection,
  FormStep,
  FormVariables,
  StringListFieldMetadata,
  ValueModeControlRef,
  ValueModeId,
  ValueModesConfig,
} from './components/forms/form-schema';
export {
  hasMinMaxStep,
  hasOptions,
  isCustomField,
  isFileField,
} from './components/forms/form-schema';
export { FormStateViewer } from './components/forms/form-state-viewer';
export type {
  ClearActionStrings,
  FormValidationStrings,
  MetadataFormStringOverrides,
  MetadataFormStrings,
} from './components/forms/form-strings';
export { DEFAULT_METADATA_FORM_STRINGS } from './components/forms/form-strings';
// -----------------------------------------------------------------------------
// Metadata Forms System
// -----------------------------------------------------------------------------
export type { MetadataFormProps } from './components/forms/metadata-form';
export { MetadataForm, useWatch } from './components/forms/metadata-form';
export type { ModeAwareFieldProps } from './components/forms/mode-aware-field';
export { ModeAwareField } from './components/forms/mode-aware-field';
export {
  ExpressionBuilder,
  RuleBuilder,
  RulesEngine,
} from './components/forms/rules-engine';
export type { StringListFieldProps } from './components/forms/string-list-field';
export { formatTemplate, StringListField } from './components/forms/string-list-field';
export type {
  CodecContext,
  ConvertResult,
  DecodedValue,
  FieldControlRegistration,
  ValueModeCodec,
  ValueModeControlHandle,
  ValueModeControlProps,
  ValueModeControlRegistration,
  ValueModeDefinition,
  ValueModeEnvelope,
  ValueModeRegistry,
  ValueModesPluginConfig,
} from './components/forms/value-modes';
export {
  envelopeCodec,
  isEmptyModeValue,
  isValueModeEnvelope,
  literalValues,
  VALUE_MODE_OPAQUE,
} from './components/forms/value-modes';
// -----------------------------------------------------------------------------
// Utility Components
// -----------------------------------------------------------------------------
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './components/ui/accordion';
export { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './components/ui/alert-dialog';
export { AspectRatio } from './components/ui/aspect-ratio';
export { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
export type { BadgeProps } from './components/ui/badge';
export { Badge, badgeVariants } from './components/ui/badge';
export type {
  BooleanRadioGroupProps,
  BooleanRadioGroupStrings,
} from './components/ui/boolean-radio-group';
export {
  BooleanRadioGroup,
  DEFAULT_BOOLEAN_RADIO_GROUP_STRINGS,
} from './components/ui/boolean-radio-group';
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
export type { ButtonProps } from './components/ui/button';
// -----------------------------------------------------------------------------
// Button Components
// -----------------------------------------------------------------------------
export { Button, buttonVariants } from './components/ui/button';
export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from './components/ui/button-group';
export { Calendar } from './components/ui/calendar';
// -----------------------------------------------------------------------------
// Data Display Components
// -----------------------------------------------------------------------------
// NOTE: CodeBlock was removed. Use Monaco or CodeMirror with Apollo editor
// themes instead. See @uipath/apollo-wind/editor-themes for the theme API and
// Patterns → Code Editors in Storybook for integration guidance.
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
export type { ChartConfig } from './components/ui/chart';
export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from './components/ui/chart';
export type { CheckboxProps } from './components/ui/checkbox';
export { Checkbox } from './components/ui/checkbox';
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './components/ui/collapsible';
export type { ComboboxItem, ComboboxProps } from './components/ui/combobox';
export { Combobox } from './components/ui/combobox';
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './components/ui/command';
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './components/ui/context-menu';
export type { DataTableProps } from './components/ui/data-table';
export {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from './components/ui/data-table';
export type { DatePickerProps, DateRangePickerProps } from './components/ui/date-picker';
export { DatePicker, DateRangePicker } from './components/ui/date-picker';
export type { DateTimePickerProps } from './components/ui/datetime-picker';
export { DateTimePicker } from './components/ui/datetime-picker';
// -----------------------------------------------------------------------------
// Feedback & Overlay Components
// -----------------------------------------------------------------------------
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  ModalTrigger,
} from './components/ui/dialog';
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from './components/ui/drawer';
// -----------------------------------------------------------------------------
// Menu Components
// -----------------------------------------------------------------------------
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
export type {
  EditableCellMeta,
  EditableCellType,
} from './components/ui/editable-cell';
export {
  createEditableColumn,
  EditableCell,
} from './components/ui/editable-cell';
export type { EmptyStateProps } from './components/ui/empty-state';
export { EmptyState } from './components/ui/empty-state';
export type {
  AiAssistActionProps,
  AiAssistActionStrings,
  InsertVariableActionProps,
  InsertVariableActionStrings,
} from './components/ui/field-actions';
export {
  AiAssistAction,
  DEFAULT_AI_ASSIST_ACTION_STRINGS,
  DEFAULT_INSERT_VARIABLE_ACTION_STRINGS,
  InsertVariableAction,
} from './components/ui/field-actions';
export type {
  BuiltInValueModesOptions,
  FieldMenuItem,
  FieldMenuMode,
  FieldMenuProps,
  ValueMode,
  ValueModeIndicatorProps,
  ValueModeOption,
  ValueModeStrings,
  ValueModeSwitchDialogProps,
} from './components/ui/field-addons';
export {
  BUILTIN_VALUE_MODES,
  builtInValueModes,
  DEFAULT_VALUE_MODE_STRINGS,
  FieldMenu,
  ValueModeIndicator,
  ValueModeSwitchDialog,
} from './components/ui/field-addons';
export type { FileUploadProps } from './components/ui/file-upload';
export { FileUpload } from './components/ui/file-upload';
export type {
  FolderPickerContentProps,
  FolderPickerEntry,
  FolderPickerLoadChildren,
  FolderPickerProps,
} from './components/ui/folder-picker';
export {
  FolderPicker,
  FolderPickerContent,
  keepFolderSearchOnEscape,
} from './components/ui/folder-picker';
export type {
  FormFieldDescriptionProps,
  FormFieldErrorProps,
  FormFieldHeaderProps,
  FormFieldLabelProps,
  FormFieldProps,
} from './components/ui/form-field';
export {
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldHeader,
  FormFieldLabel,
} from './components/ui/form-field';
export {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './components/ui/hover-card';
export type { InfoTooltipProps } from './components/ui/info-tooltip';
export { InfoTooltip } from './components/ui/info-tooltip';
export type { InputProps } from './components/ui/input';
// -----------------------------------------------------------------------------
// Form Input Components
// -----------------------------------------------------------------------------
export { Input } from './components/ui/input';
export type {
  InputGroupAddonProps,
  InputGroupBodyProps,
  InputGroupButtonProps,
  InputGroupInputProps,
  InputGroupLayout,
  InputGroupPopoverTriggerProps,
  InputGroupProps,
  InputGroupRowProps,
  InputGroupState,
  InputGroupTextareaProps,
  InputGroupTextProps,
  InputGroupTriggerProps,
} from './components/ui/input-group';
export {
  InputGroup,
  InputGroupAddon,
  InputGroupBody,
  InputGroupButton,
  InputGroupInput,
  InputGroupPopoverTrigger,
  InputGroupRow,
  InputGroupText,
  InputGroupTextarea,
  InputGroupTrigger,
  inputGroupVariants,
  useInputGroup,
} from './components/ui/input-group';
export type {
  LabelProps,
  LabelVariants,
  RequiredIndicatorProps,
} from './components/ui/label';
export { Label, RequiredIndicator } from './components/ui/label';
export type { ColumnProps } from './components/ui/layout/column';
export { Column } from './components/ui/layout/column';
export type { GridProps } from './components/ui/layout/grid';
export { Grid } from './components/ui/layout/grid';
export type { RowProps } from './components/ui/layout/row';
// -----------------------------------------------------------------------------
// Layout Components
// -----------------------------------------------------------------------------
export { Row } from './components/ui/layout/row';
export type {
  LockableFieldType,
  LockableValueFieldMode,
  LockableValueFieldMoreActions,
  LockableValueFieldOption,
  LockableValueFieldProps,
  LockableValueFieldStrings,
} from './components/ui/lockable-value-field';
export { LockableValueField } from './components/ui/lockable-value-field';
export type {
  AnnotatedModel,
  ByomDetails,
  CostTier,
  DeprecationDetails,
  DeriveModelTagsContext,
  DiscoveryModel,
  FolderSwitcherFolder,
  FolderSwitcherProps,
  GroupHeaderProps,
  GroupModelsContext,
  GroupStrategy,
  ModelBadgeDefinition,
  ModelBadgeKind,
  ModelCostDetails,
  ModelDetails,
  ModelFlatCosts,
  ModelGeography,
  ModelGroup,
  ModelOptionRowProps,
  ModelPickerChangeHandler,
  ModelPickerLabels,
  ModelPickerProps,
  ModelPickerSlotContext,
  ModelPickerSlots,
  ModelPickerVariant,
  ModelSubscriptionType,
  ModelTag,
  ModelTagChipProps,
  ModelTagKind,
  ModelTieredCost,
  ModelType,
  ModelVendor,
  OptionListProps,
  PickerPopupProps,
  PickerSearchInputProps,
  PickerTriggerProps,
  RoutingDetails,
  StaticLabelKey,
  UseModelPickerStateOptions,
  UseModelPickerStateResult,
} from './components/ui/model-picker';
export {
  DEFAULT_MODEL_PICKER_LABELS,
  defaultCostTier,
  defaultRowActions,
  deriveModelTags,
  FolderSwitcher,
  filterModels,
  formatContextWindow,
  GroupedOptionList,
  GroupHeader,
  getSubstitutionTarget,
  groupModels,
  isTextGenerationModel,
  MODEL_BADGES,
  ModelOptionRow,
  ModelPicker,
  ModelTagChip,
  optionDomId,
  PickerPopup,
  PickerSearchInput,
  PickerTrigger,
  resolveHomeGeography,
  resolveLabels,
  useModelPickerState,
  VirtualOptionList,
} from './components/ui/model-picker';
export type { MultiSelectProps } from './components/ui/multi-select';
export { MultiSelect } from './components/ui/multi-select';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './components/ui/pagination';
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/popover';
export type {
  PortalContainerOverride,
  PortalContainerProviderProps,
} from './components/ui/portal-container';
export { PortalContainerProvider } from './components/ui/portal-container';
export { Progress } from './components/ui/progress';
export type {
  MarkdownPreviewTokenOverride,
  PromptEditorAutoCompleteOption,
  PromptEditorAutocompleteMenuProps,
  PromptEditorDiffType,
  PromptEditorMode,
  PromptEditorProps,
  PromptEditorRef,
  PromptEditorRenderTokenPill,
  PromptEditorStrings,
  PromptEditorToken,
  PromptEditorTokenPillSlotProps,
  PromptEditorTokenType,
  PromptEditorToolbarActiveFormats,
  PromptTokenNode,
  TokenPillProps,
  TokenPillWithTooltipProps,
} from './components/ui/prompt-editor';
// -----------------------------------------------------------------------------
// Prompt Editor
// -----------------------------------------------------------------------------
export {
  $insertTokenAtCursor,
  createInputTokenNode,
  createOutputTokenNode,
  createResourceTokenNode,
  createStateTokenNode,
  createTokenNodeForOption,
  DEFAULT_PROMPT_EDITOR_STRINGS,
  getAllPromptTokenNodes,
  getEditorTokens,
  getPromptEditorTokenColors,
  getPromptEditorTokenTypeLabel,
  InputTokenNode,
  inferTokenTypeFromPath,
  isPromptTokenNode,
  normalizeRichTextTokens,
  normalizeVariablePath,
  OutputTokenNode,
  PROMPT_EDITOR_RICH_TRANSFORMERS,
  PromptEditor,
  ResourceTokenNode,
  StateTokenNode,
  setEditorTokens,
  TokenPill,
  TokenPillWithTooltip,
  VARIABLE_DRAG_MIME,
  VARIABLE_PATH_REGEX,
  WORD_JOINER,
} from './components/ui/prompt-editor';
export type { PromptValueControlProps } from './components/ui/prompt-value-control';
export { PromptValueControl } from './components/ui/prompt-value-control';
export type {
  QuickFieldType,
  QuickFormFieldMode,
  QuickFormFieldMoreActions,
  QuickFormFieldOption,
  QuickFormFieldProps,
  QuickFormFieldStrings,
  VariableInsertContext,
} from './components/ui/quick-form-field';
export {
  DEFAULT_QUICK_FORM_FIELD_STRINGS,
  FIELD_TYPE_META,
  FIELD_TYPE_ORDER,
  QuickFormField,
} from './components/ui/quick-form-field';
export { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
export {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './components/ui/resizable';
export { ScrollArea, ScrollBar } from './components/ui/scroll-area';
export type {
  SearchProps,
  SearchWithSuggestionsProps,
} from './components/ui/search';
export { Search, SearchWithSuggestions } from './components/ui/search';
export type { SelectTriggerProps } from './components/ui/select';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
export { Separator } from './components/ui/separator';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from './components/ui/sheet';
export type {
  SidebarMenuButtonProps,
  SidebarMenuSubButtonProps,
  SidebarProps,
  SidebarProviderProps,
} from './components/ui/sidebar';
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  sidebarMenuButtonVariants,
  useSidebar,
} from './components/ui/sidebar';
export { Skeleton } from './components/ui/skeleton';
export { Slider } from './components/ui/slider';
export { Toaster, toast } from './components/ui/sonner';
export type { SpinnerProps } from './components/ui/spinner';
export { Spinner, spinnerVariants } from './components/ui/spinner';
export type { StatsCardProps } from './components/ui/stats-card';
export { StatsCard } from './components/ui/stats-card';
export type { Step, StepperProps } from './components/ui/stepper';
export { Stepper } from './components/ui/stepper';
export { Switch } from './components/ui/switch';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
export type { ScrollableTabsListProps } from './components/ui/tabs';
// -----------------------------------------------------------------------------
// Navigation Components
// -----------------------------------------------------------------------------
export {
  ScrollableTabsList,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './components/ui/tabs';
export type { TextareaProps } from './components/ui/textarea';
export { Textarea } from './components/ui/textarea';
export { Toggle, toggleVariants } from './components/ui/toggle';
export { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
export {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip';
export type {
  BuildJsonTreeOptions,
  ContainerPath,
  CopyEvent,
  DeriveTypeIcon,
  FlatJsonTreeRow,
  FlattenOptions,
  JsonCodeEditorRenderProps,
  JsonContainer,
  JsonContainerEditorProps,
  JsonLeafValueEditorProps,
  JsonMultilineLeafEditorProps,
  JsonObject,
  JsonSchema,
  JsonSchemaTypeName,
  JsonTreeChange,
  JsonTreeFilterOption,
  JsonTreeNode,
  JsonTreeNodeType,
  JsonTreeRowWrapper,
  JsonTreeRowWrapperProps,
  JsonTreeToolbarProps,
  JsonTreeViewProps,
  JsonTreeViewProviderProps,
  JsonTreeViewStrings,
  JsonTypeBadgeProps,
  JsonValue,
  NodeAction,
  NodeActionContext,
  NodeActionsResolver,
  NodeBadgeReference,
  NodeDecoration,
  NodeDecorationBadge,
  NodeDecorationChip,
  NodeDecorationTone,
  NodeDisplayTexts,
  PathSegment,
  RenderCodeEditor,
  RenderValueCell,
  RenderValueContext,
  ResolvedJsonTreeViewStrings,
} from './components/ui/json-tree-view';
export {
  appendPathSegment,
  buildJsonTree,
  collectContainerPaths,
  copyTextToClipboard,
  DEFAULT_JSON_TREE_VIEW_STRINGS,
  flattenJsonTree,
  formatLeafValue,
  getValueAtPath,
  inferValueType,
  isArrayItemTemplateRoot,
  isJsonObject,
  JsonContainerEditor,
  JsonLeafValueEditor,
  JsonMultilineLeafEditor,
  JsonTreeToolbar,
  JsonTreeView,
  JsonTreeViewProvider,
  JsonTypeBadge,
  removeValueAtPath,
  schemaDisplayType,
  setValueAtPath,
  useJsonTreeViewStrings,
} from './components/ui/json-tree-view';
export type {
  FileTreeViewIconMap,
  FileTreeViewItem,
  FileTreeViewItemAction,
  FileTreeViewMenuItem,
  FileTreeViewProps,
  FileTreeViewSelectionMode,
  TreeViewIconMap,
  TreeViewItem,
  TreeViewItemAction,
  TreeViewMenuItem,
  TreeViewProps,
  TreeViewSelectionMode,
} from './components/ui/tree-view';
export { default as FileTreeView, TreeView } from './components/ui/tree-view';
export type {
  VariablePickerContentProps,
  VariablePickerItem,
  VariablePickerProps,
} from './components/ui/variable-picker';
export {
  VariablePicker,
  VariablePickerContent,
} from './components/ui/variable-picker';
export type { VariableValueControlProps } from './components/ui/variable-value-control';
export { VariableValueControl } from './components/ui/variable-value-control';
// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------
export { cn } from './lib/utils';
