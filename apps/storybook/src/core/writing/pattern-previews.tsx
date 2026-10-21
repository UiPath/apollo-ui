import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Bubble,
  BubbleContent,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormFieldDescription,
  FormFieldError,
  FormFieldLabel,
  Input,
  InputGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
  Progress,
  PromptSuggestions,
  Search,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Spinner,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThinkingIndicator,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@uipath/apollo-wind';
import { CircleAlert, Copy, Info, Sparkles, TriangleAlert } from 'lucide-react';
import { type ReactNode, useState } from 'react';

// Live Apollo Wind renderings of each pattern's example copy. Overlays (toasts,
// dialogs, sheets) open from the button that triggers them in a real product.

const noop = () => {};

/** Show/Hide pair: the trigger label follows the expanded state. */
function AdvancedSettingsAccordion() {
  const [value, setValue] = useState('');
  const open = value === 'advanced';
  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      className="w-full max-w-md"
    >
      <AccordionItem value="advanced">
        <AccordionTrigger>
          {open ? 'Hide advanced settings' : 'Show advanced settings'}
        </AccordionTrigger>
        <AccordionContent>Review configuration options for this automation.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** A table value whose full detail is in a tooltip, reachable by hover and keyboard focus. */
function HintedValue({ value, hint }: { value: string; hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="underline decoration-dotted underline-offset-4">
          {value}
        </button>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

/** Caption under an overlay trigger, so readers know the button opens the example. */
function TriggerHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

export const PATTERN_PREVIEWS: Record<string, ReactNode> = {
  errorMessage: (
    <Alert variant="destructive" className="max-w-md">
      <CircleAlert />
      <AlertDescription className="flex flex-col items-start gap-3">
        We couldn't upload your file. Check your connection and try again.
        <Button size="sm" variant="outline">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  ),

  notification: (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Sync failed</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          We couldn't sync your changes. Check your connection and try again.
          <Button size="sm" variant="outline">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertDescription>Storage is almost full</AlertDescription>
      </Alert>
      <div className="flex flex-col items-start gap-2">
        <Button onClick={() => toast.success('Project created')}>Create project</Button>
        <TriggerHint>Select the button to see the success toast.</TriggerHint>
      </div>
      <Toaster />
    </div>
  ),

  successConfirmation: (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            toast.success('Automation published', {
              action: { label: 'View automation', onClick: noop },
            })
          }
        >
          Publish automation
        </Button>
        <Button
          variant="outline"
          onClick={() => toast('2 files deleted', { action: { label: 'Undo', onClick: noop } })}
        >
          Delete files
        </Button>
      </div>
      <TriggerHint>Select a button to see its confirmation toast.</TriggerHint>
      <Toaster />
    </div>
  ),

  emptyState: (
    <EmptyState
      title="No automations yet"
      description="Build an automation to start running workflows in this workspace."
      action={{ label: 'Build automation', onClick: noop }}
    />
  ),

  loadingAndProgress: (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Spinner label="Loading automations" showLabel />
      <FormField>
        <div className="flex justify-between">
          <FormFieldLabel htmlFor="writing-upload-progress">Uploading 3 of 5 files</FormFieldLabel>
          <span className="text-sm text-muted-foreground">60%</span>
        </div>
        <Progress id="writing-upload-progress" value={60} aria-label="Uploading files" />
        <FormFieldDescription>
          You can leave this page. We'll notify you when the upload is done.
        </FormFieldDescription>
      </FormField>
    </div>
  ),

  onboarding: (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Build your first automation</CardTitle>
        <CardDescription>Connect an app, add a trigger, and run a test job.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">Step 2 of 3</p>
        <Stepper
          currentStep={1}
          steps={[
            { title: 'Connect an app' },
            { title: 'Add a trigger' },
            { title: 'Run a test job' },
          ]}
        />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Skip tour</Button>
        <Button variant="outline">Back</Button>
        <Button>Next</Button>
      </CardFooter>
    </Card>
  ),

  aiAndAgents: (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <ThinkingIndicator label="Searching your documents" />
      <Message align="start">
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>
            Autopilot
            <Badge variant="secondary" className="ml-2 gap-1">
              <Sparkles className="size-3" /> AI-generated
            </Badge>
          </MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>
              Invoices from 3 vendors are overdue. The largest is $12,400 from Contoso.
            </BubbleContent>
          </Bubble>
          <MessageFooter>
            AI can make mistakes. Review the results before you act on them.
          </MessageFooter>
        </MessageContent>
      </Message>
      <PromptSuggestions
        orientation="horizontal"
        density="compact"
        suggestions={[{ label: 'Summarize overdue invoices' }, { label: 'Draft a reminder email' }]}
      />
    </div>
  ),

  buttonAndCta: (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Build automation</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="link">Manage access</Button>
    </div>
  ),

  link: (
    <Alert variant="info" className="max-w-md">
      <Info />
      <AlertDescription>
        Files older than 90 days are deleted automatically.{' '}
        <Button variant="link" asChild className="h-auto p-0">
          <a href="#retention">Review retention policy</a>
        </Button>
      </AlertDescription>
    </Alert>
  ),

  toggleAndSelection: (
    <FormField className="max-w-md">
      <div className="flex items-center gap-3">
        <Switch
          id="writing-email-notifications"
          aria-describedby="writing-email-notifications-help"
          defaultChecked
        />
        <FormFieldLabel htmlFor="writing-email-notifications">Email notifications</FormFieldLabel>
      </div>
      <FormFieldDescription id="writing-email-notifications-help">
        Send notifications when a job starts or fails.
      </FormFieldDescription>
    </FormField>
  ),

  destructiveModal: (
    <div className="flex flex-col items-start gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete automation</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this automation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the automation and all associated logs. You can't undo
              this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })}>
              Delete automation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <TriggerHint>Select the button to open the confirmation dialog.</TriggerHint>
    </div>
  ),

  formField: (
    <FormField className="w-full max-w-sm">
      <FormFieldLabel htmlFor="writing-workspace-name" required>
        Workspace name
      </FormFieldLabel>
      <InputGroup>
        <Input
          id="writing-workspace-name"
          required
          aria-invalid
          aria-describedby="writing-workspace-name-help writing-workspace-name-error"
        />
      </InputGroup>
      <FormFieldDescription id="writing-workspace-name-help">
        Use a name your team will recognize.
      </FormFieldDescription>
      <FormFieldError id="writing-workspace-name-error">Enter a workspace name</FormFieldError>
    </FormField>
  ),

  searchAndFilter: (
    <div className="flex w-full max-w-md flex-col gap-4">
      <FormField>
        <FormFieldLabel htmlFor="writing-search">Search</FormFieldLabel>
        <Search id="writing-search" placeholder="Search automations and folders" />
      </FormField>
      <EmptyState
        size="compact"
        title="No results"
        description="No results match your search or filters. Try adjusting your search term or clearing your filters."
        action={{ label: 'Clear all filters', onClick: noop }}
      />
    </div>
  ),

  tabsAndNavigation: (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Project settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h3 className="text-lg font-semibold text-foreground">Project settings</h3>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-3 text-sm text-muted-foreground">
          Access and permissions
        </TabsContent>
      </Tabs>
    </div>
  ),

  drawer: (
    <div className="flex flex-col items-start gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Edit settings</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit project settings</SheetTitle>
            <SheetDescription>Changes apply to all members of this project.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-6">
            <p className="text-sm font-medium text-foreground">Access and permissions</p>
            <FormField>
              <FormFieldLabel htmlFor="writing-drawer-owner">Project owner</FormFieldLabel>
              <InputGroup>
                <Input id="writing-drawer-owner" defaultValue="Daniel" />
              </InputGroup>
            </FormField>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <TriggerHint>Select the button to open the drawer.</TriggerHint>
    </div>
  ),

  accordionAndDisclosure: <AdvancedSettingsAccordion />,

  tableAndStatus: (
    <TooltipProvider>
      <Table className="whitespace-nowrap">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Invoice intake</TableCell>
            <TableCell>
              <Badge variant="info">In progress</Badge>
            </TableCell>
            <TableCell>
              <HintedValue value="Updated 5 minutes ago" hint="December 12, 2025 at 4:12 PM UTC" />
            </TableCell>
            <TableCell>2h 15m 30s</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Vendor sync</TableCell>
            <TableCell>
              <Badge variant="success">Completed</Badge>
            </TableCell>
            <TableCell>May 30, 2025</TableCell>
            <TableCell>
              <HintedValue value="2.25 hrs" hint="2h 15m 00s" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TooltipProvider>
  ),

  dateTimeAndDuration: (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Last updated</span>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button type="button" className="text-foreground underline decoration-dotted">
              Updated 1 hour ago
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">December 12, 2025 at 4:12 PM UTC</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),

  tooltip: (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Copy">
            <Copy />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Copy</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
