import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Progress,
  PromptSuggestions,
  Search,
  Spinner,
  Stepper,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThinkingIndicator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { CircleAlert, CircleCheck, Copy, Info, Sparkles, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

// Live Apollo Wind renderings of each pattern's example copy. Dialogs and
// drawers render inline as cards so the copy sits in the page flow.

const noop = () => {};

/** Stand-in for an overlay (dialog, drawer) rendered in the page flow. */
function InlineSurface({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      <CardFooter className="justify-end gap-2">{footer}</CardFooter>
    </Card>
  );
}

export const PATTERN_PREVIEWS: Record<string, ReactNode> = {
  errorMessage: (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>
          We couldn't upload your file. Check your connection and try again.
        </AlertDescription>
      </Alert>
      <Button className="self-start">Try again</Button>
    </div>
  ),

  notification: (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Sync failed</AlertTitle>
        <AlertDescription>
          We couldn't sync your changes. Check your connection and try again.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertDescription>Storage is almost full</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CircleCheck />
        <AlertDescription>Project created</AlertDescription>
      </Alert>
    </div>
  ),

  emptyState: (
    <EmptyState
      title="No automations yet"
      description="Build an automation to start running workflows in this workspace."
      action={{ label: 'Build automation', onClick: noop }}
    />
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
        <a href="#retention" className="text-primary underline underline-offset-2">
          Review retention policy
        </a>
      </AlertDescription>
    </Alert>
  ),

  toggleAndSelection: (
    <div className="flex max-w-md items-start gap-3">
      <Switch id="writing-email-notifications" defaultChecked />
      <div className="flex flex-col gap-1">
        <Label htmlFor="writing-email-notifications">Email notifications</Label>
        <p className="text-sm text-muted-foreground">
          Send notifications when a job starts or fails.
        </p>
      </div>
    </div>
  ),

  destructiveModal: (
    <InlineSurface
      title="Delete this automation?"
      description="This will permanently delete the automation and all associated logs. You can't undo this action."
      footer={
        <>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete automation</Button>
        </>
      }
    />
  ),

  formField: (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="writing-workspace-name">Workspace name</Label>
      <Input id="writing-workspace-name" error="Enter a workspace name" />
      <p className="text-sm text-muted-foreground">Use a name your team will recognize.</p>
    </div>
  ),

  searchAndFilter: (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="writing-search">Search</Label>
        <Search id="writing-search" placeholder="Search automations and folders" />
      </div>
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
    <InlineSurface
      title="Edit project settings"
      footer={
        <>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </>
      }
    >
      <p className="mb-1 text-sm font-medium text-foreground">Access and permissions</p>
      <p className="text-sm text-muted-foreground">Changes apply to all members of this project.</p>
    </InlineSurface>
  ),

  accordionAndDisclosure: (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="advanced">
        <AccordionTrigger>Show advanced settings</AccordionTrigger>
        <AccordionContent>Review configuration options for this automation.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),

  tableAndStatus: (
    <table className="w-full max-w-lg text-left text-sm">
      <thead className="text-muted-foreground">
        <tr>
          <th className="py-2 font-medium">Name</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Last updated</th>
          <th className="py-2 font-medium">Duration</th>
        </tr>
      </thead>
      <tbody className="text-foreground">
        <tr className="border-t border-border">
          <td className="py-2">Invoice intake</td>
          <td className="py-2">
            <Badge variant="info">In progress</Badge>
          </td>
          <td className="py-2">Updated 5 minutes ago</td>
          <td className="py-2">2h 15m 30s</td>
        </tr>
        <tr className="border-t border-border">
          <td className="py-2">Vendor sync</td>
          <td className="py-2">
            <Badge variant="success">Completed</Badge>
          </td>
          <td className="py-2">May 30, 2025</td>
          <td className="py-2">2.25 hrs</td>
        </tr>
      </tbody>
    </table>
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

  aiAndAgents: (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ThinkingIndicator label="Searching your documents" />
      <div className="rounded-xl border border-border-subtle bg-surface p-3 text-sm text-foreground">
        <Badge variant="secondary" className="mb-2 gap-1">
          <Sparkles className="size-3" /> AI-generated
        </Badge>
        <p>Invoices from 3 vendors are overdue. The largest is $12,400 from Contoso.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          AI can make mistakes. Review the results before you act on them.
        </p>
      </div>
      <PromptSuggestions
        orientation="horizontal"
        density="compact"
        suggestions={[{ label: 'Summarize overdue invoices' }, { label: 'Draft a reminder email' }]}
      />
    </div>
  ),

  loadingAndProgress: (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Spinner label="Loading automations" showLabel />
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground">Uploading 3 of 5 files</span>
          <span className="text-muted-foreground">60%</span>
        </div>
        <Progress value={60} aria-label="Uploading files" />
        <p className="text-xs text-muted-foreground">
          You can leave this page. We'll notify you when the upload is done.
        </p>
      </div>
    </div>
  ),

  onboarding: (
    <InlineSurface
      title="Build your first automation"
      description="Connect an app, add a trigger, and run a test job."
      footer={
        <>
          <Button variant="ghost">Skip tour</Button>
          <Button variant="outline">Back</Button>
          <Button>Next</Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">Step 2 of 3</p>
      <Stepper
        currentStep={1}
        steps={[
          { title: 'Connect an app' },
          { title: 'Add a trigger' },
          { title: 'Run a test job' },
        ]}
      />
    </InlineSurface>
  ),

  successConfirmation: (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="success">
        <CircleCheck />
        <AlertDescription className="flex items-center justify-between gap-3">
          Automation published
          <Button variant="link" size="sm" className="h-auto p-0">
            View automation
          </Button>
        </AlertDescription>
      </Alert>
      <Alert>
        <Info />
        <AlertDescription className="flex items-center justify-between gap-3">
          2 files deleted
          <Button variant="link" size="sm" className="h-auto p-0">
            Undo
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  ),
};
