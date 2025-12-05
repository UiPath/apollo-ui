// =============================================================================
// @uipath/wind - Public API Exports
// =============================================================================

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------
export { cn } from "./lib/utils";

// -----------------------------------------------------------------------------
// Layout Components
// -----------------------------------------------------------------------------
export { Row } from "./components/ui/layout/row";
export type { RowProps } from "./components/ui/layout/row";

export { Column } from "./components/ui/layout/column";
export type { ColumnProps } from "./components/ui/layout/column";

export { Grid } from "./components/ui/layout/grid";
export type { GridProps } from "./components/ui/layout/grid";

// -----------------------------------------------------------------------------
// Button Components
// -----------------------------------------------------------------------------
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "./components/ui/button-group";

export { Toggle, toggleVariants } from "./components/ui/toggle";

export { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";

// -----------------------------------------------------------------------------
// Form Input Components
// -----------------------------------------------------------------------------
export { Input } from "./components/ui/input";
export type { InputProps } from "./components/ui/input";

export { Textarea } from "./components/ui/textarea";
export type { TextareaProps } from "./components/ui/textarea";

export { Label } from "./components/ui/label";
export type { LabelProps } from "./components/ui/label";

export { Checkbox } from "./components/ui/checkbox";
export type { CheckboxProps } from "./components/ui/checkbox";

export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";

export { Switch } from "./components/ui/switch";

export { Slider } from "./components/ui/slider";

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
} from "./components/ui/select";

export { Combobox } from "./components/ui/combobox";

export { MultiSelect } from "./components/ui/multi-select";
export type { MultiSelectProps } from "./components/ui/multi-select";

export { Search, SearchWithSuggestions } from "./components/ui/search";
export type {
  SearchProps,
  SearchWithSuggestionsProps,
} from "./components/ui/search";

export { Calendar } from "./components/ui/calendar";

export { DatePicker } from "./components/ui/date-picker";

export { DateTimePicker } from "./components/ui/datetime-picker";
export type { DateTimePickerProps } from "./components/ui/datetime-picker";

export { FileUpload } from "./components/ui/file-upload";

// -----------------------------------------------------------------------------
// Data Display Components
// -----------------------------------------------------------------------------
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

export { StatsCard } from "./components/ui/stats-card";
export type { StatsCardProps } from "./components/ui/stats-card";

export { Badge, badgeVariants } from "./components/ui/badge";
export type { BadgeProps } from "./components/ui/badge";

export { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";

export {
  DataTable,
  DataTableColumnHeader,
  DataTableSelectColumn,
} from "./components/ui/data-table";
export type { DataTableProps } from "./components/ui/data-table";

export {
  EditableCell,
  createEditableColumn,
} from "./components/ui/editable-cell";
export type {
  EditableCellMeta,
  EditableCellType,
} from "./components/ui/editable-cell";

export { Progress } from "./components/ui/progress";

export { Skeleton } from "./components/ui/skeleton";

export { Spinner, spinnerVariants } from "./components/ui/spinner";
export type { SpinnerProps } from "./components/ui/spinner";

export { EmptyState } from "./components/ui/empty-state";
export type { EmptyStateProps } from "./components/ui/empty-state";

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
} from "./components/ui/dialog";

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
} from "./components/ui/alert-dialog";

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
} from "./components/ui/sheet";

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
} from "./components/ui/drawer";

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";

export {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./components/ui/hover-card";

export { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

export { Toaster } from "./components/ui/sonner";

// -----------------------------------------------------------------------------
// Navigation Components
// -----------------------------------------------------------------------------
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./components/ui/pagination";

export { Stepper } from "./components/ui/stepper";
export type { Step, StepperProps } from "./components/ui/stepper";

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "./components/ui/navigation-menu";

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
} from "./components/ui/dropdown-menu";

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
} from "./components/ui/context-menu";

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
} from "./components/ui/command";

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./components/ui/menubar";

// -----------------------------------------------------------------------------
// Utility Components
// -----------------------------------------------------------------------------
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";

export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible";

export { ScrollArea, ScrollBar } from "./components/ui/scroll-area";

export { Separator } from "./components/ui/separator";

export {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";

export { AspectRatio } from "./components/ui/aspect-ratio";

// -----------------------------------------------------------------------------
// Metadata Forms System
// -----------------------------------------------------------------------------
export { MetadataForm } from "./components/forms/metadata-form";
export { FormFieldRenderer } from "./components/forms/field-renderer";
export { FormDesigner } from "./components/forms/form-designer";
export { FormStateViewer } from "./components/forms/form-state-viewer";

export {
  RulesEngine,
  RuleBuilder,
  ExpressionBuilder,
} from "./components/forms/rules-engine";

export {
  DataFetcher,
  DataSourceBuilder,
  DataTransformers,
  FetchAdapter,
} from "./components/forms/data-fetcher";
export type {
  DataAdapter,
  AdapterRequest,
  AdapterResponse,
} from "./components/forms/data-fetcher";

export {
  analyticsPlugin,
  autoSavePlugin,
  validationPlugin,
  workflowPlugin,
  auditPlugin,
  formattingPlugin,
} from "./components/forms/form-plugins";

export type {
  FormSchema,
  FormSection,
  FormStep,
  FieldMetadata,
  FieldType,
  FieldCondition,
  FieldRule,
  DataSource,
  FormContext,
  FormPlugin,
  FormAction,
  CustomFieldComponentProps,
  FieldOption,
} from "./components/forms/form-schema";

export {
  hasOptions,
  hasMinMaxStep,
  isFileField,
  isCustomField,
} from "./components/forms/form-schema";
