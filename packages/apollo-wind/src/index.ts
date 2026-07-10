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
  CustomFieldComponentProps,
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
} from './components/forms/form-schema';
export {
  hasMinMaxStep,
  hasOptions,
  isCustomField,
  isFileField,
} from './components/forms/form-schema';
export { FormStateViewer } from './components/forms/form-state-viewer';
// -----------------------------------------------------------------------------
// Metadata Forms System
// -----------------------------------------------------------------------------
export { MetadataForm } from './components/forms/metadata-form';
export {
  ExpressionBuilder,
  RuleBuilder,
  RulesEngine,
} from './components/forms/rules-engine';
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
export type {
  AttachmentMediaProps,
  AttachmentProps,
  AttachmentTriggerProps,
} from './components/ui/attachment';
export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from './components/ui/attachment';
export { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
export type { BadgeProps } from './components/ui/badge';
export { Badge, badgeVariants } from './components/ui/badge';
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './components/ui/breadcrumb';
export type { BubbleContentProps, BubbleProps, BubbleReactionsProps } from './components/ui/bubble';
export { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from './components/ui/bubble';
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
export type { CheckboxProps } from './components/ui/checkbox';
export { Checkbox } from './components/ui/checkbox';
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './components/ui/collapsible';
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
export { DatePicker } from './components/ui/date-picker';
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
} from './components/ui/dialog';
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
export { FileUpload } from './components/ui/file-upload';
export {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './components/ui/hover-card';
export type { InputProps } from './components/ui/input';
// -----------------------------------------------------------------------------
// Form Input Components
// -----------------------------------------------------------------------------
export { Input } from './components/ui/input';
export type {
  InputGroupAddonProps,
  InputGroupButtonProps,
  InputGroupInputProps,
  InputGroupProps,
  InputGroupTextareaProps,
  InputGroupTextProps,
} from './components/ui/input-group';
export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './components/ui/input-group';
export type { LabelProps } from './components/ui/label';
export { Label } from './components/ui/label';
export type { ColumnProps } from './components/ui/layout/column';
export { Column } from './components/ui/layout/column';
export type { GridProps } from './components/ui/layout/grid';
export { Grid } from './components/ui/layout/grid';
export type { RowProps } from './components/ui/layout/row';
// -----------------------------------------------------------------------------
// Layout Components
// -----------------------------------------------------------------------------
export { Row } from './components/ui/layout/row';
export type { MarkerProps } from './components/ui/marker';
export { Marker, MarkerContent, MarkerIcon, markerVariants } from './components/ui/marker';
export type { MessageProps } from './components/ui/message';
export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from './components/ui/message';
export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from './components/ui/message-scroller';
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
export { Progress } from './components/ui/progress';
export type {
  PromptEditorAutoCompleteOption,
  PromptEditorMode,
  PromptEditorProps,
  PromptEditorRef,
  PromptEditorToken,
  PromptEditorTokenType,
} from './components/ui/prompt-editor';
// -----------------------------------------------------------------------------
// Prompt Editor
// -----------------------------------------------------------------------------
export { PromptEditor, VARIABLE_DRAG_MIME } from './components/ui/prompt-editor';
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
  TreeViewIconMap,
  TreeViewItem,
  TreeViewItemAction,
  TreeViewMenuItem,
  TreeViewProps,
  TreeViewSelectionMode,
} from './components/ui/tree-view';
export { default as TreeView } from './components/ui/tree-view';
// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------
export { cn } from './lib/utils';
