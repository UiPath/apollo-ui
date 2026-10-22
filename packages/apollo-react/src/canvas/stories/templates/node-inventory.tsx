import {
  Button,
  Checkbox,
  Input,
  Label,
  RequiredIndicator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import { NodePropertyPanel } from '../../components/NodePropertyPanel';
import { CanvasIcon } from '../../utils/icon-registry';

// Flow node inventory shared by the Flow Standalone template and the Flow Node
// Panels pattern page: the node catalog, plus hand-built panel mockups taken
// from Figma for the nodes that have one.

export const VARIABLE_TAB_LIST_CLASS =
  'mx-3 h-auto justify-start gap-0.5 overflow-x-auto rounded-lg bg-transparent p-0.5 text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
export const VARIABLE_TAB_TRIGGER_CLASS =
  'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-xs font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-surface-overlay data-[state=active]:text-foreground data-[state=active]:shadow-sm';

export type NodeInventoryItem = {
  id: string;
  label: string;
  category: string;
  nodeType: string;
  icon: string;
  source?: 'built-in' | 'dynamic';
};

export const NODE_INVENTORY_GROUPS: {
  category: string;
  items: Omit<NodeInventoryItem, 'category'>[];
}[] = [
  {
    category: 'Agents',
    items: [
      {
        id: 'autonomous-agent',
        label: 'Autonomous agent',
        nodeType: 'uipath.agent.autonomous',
        icon: 'autonomous-agent',
      },
      {
        id: 'conversational-agent',
        label: 'Conversational agent',
        nodeType: 'uipath.agent.conversational',
        icon: 'conversational-agent',
      },
      { id: 'voice-agent', label: 'Voice agent', nodeType: 'uipath.agent.voice', icon: 'phone' },
    ],
  },
  {
    category: 'Agent resources',
    items: [
      {
        id: 'escalation',
        label: 'Escalation',
        nodeType: 'uipath.agent.resource.escalation',
        icon: 'user-round-check',
      },
      {
        id: 'quick-form-escalation',
        label: 'Quick Form escalation',
        nodeType: 'uipath.agent.resource.escalation.quick-form',
        icon: 'clipboard-check',
      },
      {
        id: 'action-app-escalation',
        label: 'Action App escalation',
        nodeType: 'uipath.agent.resource.escalation.coded-action-app',
        icon: 'panels-top-left',
      },
    ],
  },
  {
    category: 'Connectors',
    items: [
      {
        id: 'http-request-v2',
        label: 'HTTP Request',
        nodeType: 'core.action.http.v2',
        icon: 'globe',
      },
      {
        id: 'slack-send',
        label: 'Send Message',
        nodeType: 'connector.slack.send-message',
        icon: 'message-square',
        source: 'dynamic',
      },
    ],
  },
  {
    category: 'Data',
    items: [
      {
        id: 'batch-transform',
        label: 'Batch transform',
        nodeType: 'uipath.pattern.batch-transform',
        icon: 'table-properties',
      },
      {
        id: 'filter',
        label: 'Filter',
        nodeType: 'core.action.transform.filter',
        icon: 'list-filter',
      },
      {
        id: 'group-by',
        label: 'Group by',
        nodeType: 'core.action.transform.group-by',
        icon: 'group',
      },
      { id: 'map', label: 'Map', nodeType: 'core.action.transform.map', icon: 'arrow-right' },
      {
        id: 'transform',
        label: 'Transform',
        nodeType: 'core.action.transform',
        icon: 'case-upper',
      },
      {
        id: 'read-entity',
        label: 'Read entity',
        nodeType: 'core.datafabric.read',
        icon: 'database',
      },
      {
        id: 'update-entity',
        label: 'Update entity',
        nodeType: 'core.datafabric.update',
        icon: 'database-zap',
      },
    ],
  },
  {
    category: 'Document',
    items: [
      {
        id: 'summarize',
        label: 'Summarize',
        nodeType: 'uipath.agent.resource.tool.builtin.summarize',
        icon: 'sigma',
      },
      {
        id: 'extract',
        label: 'Extract',
        nodeType: 'connector.document.extract',
        icon: 'file-scan',
        source: 'dynamic',
      },
      { id: 'classify', label: 'Classify', nodeType: 'uipath.document.classify', icon: 'files' },
      {
        id: 'document-validation',
        label: 'Document Validation',
        nodeType: 'uipath.human-in-the-loop.document-validation',
        icon: 'file-check-2',
      },
      {
        id: 'analyze-files',
        label: 'Analyze Files',
        nodeType: 'uipath.agent.resource.tool.builtin.analyzefiles',
        icon: 'scan-search',
      },
    ],
  },
  {
    category: 'Human',
    items: [
      {
        id: 'quick-form',
        label: 'Quick Form',
        nodeType: 'uipath.human-in-the-loop.quick-form',
        icon: 'users',
      },
      {
        id: 'action-app',
        label: 'Action App',
        nodeType: 'uipath.human-in-the-loop.coded-action-app',
        icon: 'user-round-cog',
      },
      {
        id: 'human-task',
        label: 'Human Task',
        nodeType: 'uipath.human-in-the-loop',
        icon: 'user-round-check',
      },
    ],
  },
  {
    category: 'Control',
    items: [
      { id: 'mock', label: 'Mock', nodeType: 'core.logic.mock', icon: 'scan-dashed' },
      { id: 'decision', label: 'Decision', nodeType: 'core.logic.decision', icon: 'decision' },
      { id: 'switch', label: 'Switch', nodeType: 'core.logic.switch', icon: 'switch' },
      { id: 'merge', label: 'Merge', nodeType: 'core.logic.merge', icon: 'git-merge' },
      { id: 'end', label: 'End', nodeType: 'core.control.end', icon: 'circle-check' },
      { id: 'terminate', label: 'Terminate', nodeType: 'core.logic.terminate', icon: 'circle-x' },
      { id: 'do-while', label: 'Do while', nodeType: 'core.logic.dowhile', icon: 'repeat-2' },
      { id: 'loop', label: 'Loop', nodeType: 'core.logic.loop', icon: 'refresh-cw' },
    ],
  },
  {
    category: 'Tool',
    items: [
      { id: 'script', label: 'Script', nodeType: 'core.action.script', icon: 'code-2' },
      {
        id: 'wait-message',
        label: 'Wait for message',
        nodeType: 'uipath.conversational.wait-for-message',
        icon: 'message-square-more',
      },
      {
        id: 'conversation-context',
        label: 'Get conversation context',
        nodeType: 'uipath.conversational.get-conversation-context',
        icon: 'messages-square',
      },
      {
        id: 'send-message',
        label: 'Send message',
        nodeType: 'uipath.conversational.send-message',
        icon: 'message-square-plus',
      },
      {
        id: 'queue-create',
        label: 'Create queue item',
        nodeType: 'core.action.queue.create',
        icon: 'list-plus',
      },
      {
        id: 'queue-create-wait',
        label: 'Create and wait for queue item',
        nodeType: 'core.action.queue.create-and-wait',
        icon: 'list-checks',
      },
      {
        id: 'outgoing-call',
        label: 'Create outgoing call',
        nodeType: 'uipath.conversational.voice.create-outgoing-call',
        icon: 'phone-outgoing',
      },
      {
        id: 'end-call',
        label: 'End call',
        nodeType: 'uipath.conversational.voice.end-call',
        icon: 'phone-off',
      },
      {
        id: 'client-side-tool',
        label: 'Client-side tool',
        nodeType: 'uipath.agent.resource.tool.clientside',
        icon: 'monitor-cog',
      },
    ],
  },
  {
    category: 'Triggers',
    items: [
      {
        id: 'manual-trigger',
        label: 'Manual trigger',
        nodeType: 'core.trigger.manual',
        icon: 'play',
      },
      {
        id: 'scheduled-trigger',
        label: 'Scheduled trigger',
        nodeType: 'core.trigger.scheduled',
        icon: 'calendar-clock',
      },
      {
        id: 'slack-trigger',
        label: 'Message Received in Slack',
        nodeType: 'connector.slack.message-received',
        icon: 'message-circle',
        source: 'dynamic',
      },
      {
        id: 'http-webhook',
        label: 'HTTP Webhook',
        nodeType: 'connector.http.webhook',
        icon: 'webhook',
        source: 'dynamic',
      },
      {
        id: 'incoming-call',
        label: 'Incoming call',
        nodeType: 'core.trigger.voice',
        icon: 'phone-incoming',
      },
      {
        id: 'conversation-trigger',
        label: 'Conversation trigger',
        nodeType: 'core.trigger.conversation',
        icon: 'messages-square',
      },
      {
        id: 'form-trigger',
        label: 'Form trigger',
        nodeType: 'core.trigger.form',
        icon: 'clipboard-list',
      },
    ],
  },
  {
    category: 'Wait for event',
    items: [
      { id: 'delay', label: 'Delay', nodeType: 'core.logic.delay', icon: 'timer' },
      {
        id: 'webhook-wait',
        label: 'HTTP Webhook callback',
        nodeType: 'connector.http.webhook-wait',
        icon: 'webhook',
        source: 'dynamic',
      },
      {
        id: 'email-wait',
        label: 'Email Received (Wait)',
        nodeType: 'connector.gmail.email-received-wait',
        icon: 'mail-clock',
        source: 'dynamic',
      },
    ],
  },
  {
    category: 'UiPath',
    items: [
      { id: 'subflow', label: 'Subflow', nodeType: 'core.subflow', icon: 'layers' },
      {
        id: 'flow',
        label: 'Flow',
        nodeType: 'resource.flow',
        icon: 'flow-project',
        source: 'dynamic',
      },
      {
        id: 'bpmn',
        label: 'BPMN',
        nodeType: 'resource.maestro-bpmn',
        icon: 'agentic-process',
        source: 'dynamic',
      },
      {
        id: 'case',
        label: 'Case',
        nodeType: 'resource.maestro-case',
        icon: 'case-management',
        source: 'dynamic',
      },
      {
        id: 'rpa-workflow',
        label: 'RPA Workflow',
        nodeType: 'resource.rpa-workflow',
        icon: 'rpa',
        source: 'dynamic',
      },
      {
        id: 'api-workflow',
        label: 'API Workflow',
        nodeType: 'resource.api-workflow',
        icon: 'api',
        source: 'dynamic',
      },
    ],
  },
];

export const NODE_INVENTORY_ITEMS: NodeInventoryItem[] = NODE_INVENTORY_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, category: group.category }))
);

export type InventoryField = {
  label: string;
  value?: string;
  helper?: string;
  kind?: 'expression' | 'select' | 'textarea' | 'toggle' | 'checkbox';
  required?: boolean;
};

export type InventoryPanelSpec = {
  section?: string;
  description?: string;
  fields?: InventoryField[];
  action?: string;
  empty?: boolean;
};

export const NODE_PANEL_SPECS: Record<string, InventoryPanelSpec> = {
  'autonomous-agent': {
    section: 'Agent settings',
    fields: [
      { label: 'Harness', value: 'Standard harness', kind: 'select' },
      { label: 'Model', value: 'anthropic.claude-sonnet-5', kind: 'select', required: true },
      {
        label: 'System prompt',
        value: 'You are an agentic assistant.',
        kind: 'textarea',
        required: true,
      },
      {
        label: 'User prompt',
        value: 'What is the current date?',
        kind: 'textarea',
        required: true,
      },
    ],
    action: 'Add output variable',
  },
  'conversational-agent': {
    section: 'Agent settings',
    fields: [
      { label: 'Model', value: 'anthropic.claude-sonnet-5', kind: 'select' },
      { label: 'System prompt', value: "You're an agent", kind: 'textarea' },
      { label: 'Conversation context', value: '$vars.flowTest', kind: 'expression' },
      {
        label: 'End exchange',
        helper: 'End the conversation exchange after this response.',
        kind: 'checkbox',
      },
    ],
    action: 'Add output variable',
  },
  'voice-agent': {
    section: 'Agent settings',
    fields: [
      { label: 'Model', value: 'gemini-3.1-flash-live-preview', kind: 'select' },
      { label: 'Persona', value: 'Aoede', kind: 'select' },
      { label: 'System prompt', value: '', kind: 'textarea' },
      { label: 'Call context', value: '$metadata.FolderKey', kind: 'expression' },
    ],
    action: 'Add output variable',
  },
  'http-request-v2': {
    fields: [
      { label: 'Authentication', value: 'Manual authentication', kind: 'select', required: true },
      { label: 'Method', value: 'POST', kind: 'select', required: true },
      { label: 'URL', value: 'https://catfact.ninja/fact', kind: 'expression', required: true },
      { label: 'Body', value: '', kind: 'textarea' },
    ],
    action: 'Add header or query pair',
  },
  'slack-send': {
    fields: [
      { label: 'Slack connection', value: 'Example workspace', kind: 'select', required: true },
      {
        label: 'Channel name/ID',
        value: 'general - C0EXAMPLE',
        kind: 'expression',
        required: true,
      },
      { label: 'Message', value: 'Test', kind: 'expression', required: true },
      { label: 'Send as', value: 'Bot', kind: 'select', required: true },
      { label: 'Button actions', value: '', kind: 'expression' },
      { label: 'Image URL', value: '', kind: 'expression' },
    ],
  },
  'batch-transform': {
    section: 'Data source',
    fields: [
      { label: 'Attachment', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Prompt', value: 'Transform the data', kind: 'textarea', required: true },
      { label: 'Enable web search grounding', kind: 'checkbox' },
      { label: 'Output column', value: 'OutputColumn1' },
      {
        label: 'Description',
        value: 'Describe what this new column should contain',
        kind: 'textarea',
      },
    ],
    action: 'Add column',
  },
  filter: {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Condition', value: 'Equals', kind: 'select' },
      { label: 'Value', value: '1' },
    ],
    action: 'Add condition',
  },
  'group-by': {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Operation', value: 'Count', kind: 'select', required: true },
      { label: 'Output name', value: 'count', required: true },
    ],
    action: 'Add aggregation',
  },
  map: {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Transformation', value: 'Trim whitespace', kind: 'select' },
    ],
    action: 'Add field',
  },
  transform: {
    description: 'Build a visual transformation from input to output.',
    action: 'Edit transformation',
  },
  'read-entity': {
    fields: [
      { label: 'Data Fabric entity', value: 'Account', kind: 'select' },
      { label: 'Filter field', value: 'Field', kind: 'select' },
      { label: 'Filter value', value: '$vars.flowTest', kind: 'expression' },
    ],
    action: 'Add AND or OR filter',
  },
  'update-entity': {
    section: 'How to identify the record',
    fields: [
      { label: 'Data Fabric entity', value: 'Account', kind: 'select' },
      { label: 'Record ID', value: '1', kind: 'expression' },
      { label: 'Field to update', value: 'AnotherThing', kind: 'select' },
      { label: 'New value', value: '1', kind: 'expression' },
    ],
    action: 'Add field',
  },
  summarize: {
    section: 'Data source',
    fields: [
      { label: 'Attachment', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Prompt', value: 'Summarize this', kind: 'textarea', required: true },
    ],
  },
  extract: {
    section: 'Model config',
    fields: [
      { label: 'Model family', value: 'Gemini', kind: 'select' },
      { label: 'Model version', value: '2.5 Flash', kind: 'select' },
      { label: 'Execution mode', value: 'Standard', kind: 'select' },
      { label: 'File', value: '$vars.flowTest', kind: 'expression', required: true },
      {
        label: 'Overall extraction instructions',
        value: 'Context relevant across the whole schema...',
        kind: 'textarea',
      },
    ],
    action: 'Add field group',
  },
  'quick-form': {
    section: 'Task delivery',
    fields: [
      { label: 'Delivery channel', value: 'Slack', kind: 'select' },
      { label: 'Assignment criteria', value: 'All users', kind: 'select' },
      { label: 'Form title', value: 'Quick Approval' },
      { label: 'New field', value: '', kind: 'expression' },
    ],
    action: 'Add outcome',
  },
  'action-app': {
    section: 'Task delivery',
    fields: [
      { label: 'Delivery channel', value: 'Slack', kind: 'select' },
      { label: 'Assignment criteria', value: 'Single User', kind: 'select' },
      { label: 'Assignee', value: 'user@example.com' },
      { label: 'Action App', value: 'Select a coded action app', kind: 'select' },
    ],
  },
  mock: { empty: true },
  merge: { empty: true },
  flow: { empty: true },
  'rpa-workflow': { empty: true },
  decision: {
    fields: [
      { label: 'Condition', value: '$vars.flowBoolean', kind: 'expression', required: true },
      { label: 'True branch label', value: 'True' },
      { label: 'False branch label', value: 'False' },
    ],
  },
  switch: {
    section: 'Switch cases',
    fields: [
      { label: 'Case 1', value: '$vars.flowBoolean', kind: 'expression' },
      { label: 'Other', value: '$vars.flowBoolean', kind: 'expression' },
    ],
    action: 'Add case',
  },
  end: { action: 'Add output variable' },
  terminate: { empty: true },
  loop: {
    fields: [
      { label: 'Collection', value: '$vars.flowArray', kind: 'expression', required: true },
      { label: 'Parallel', helper: 'Run iterations at the same time.', kind: 'toggle' },
      { label: 'Break on condition', value: '$vars.flowBoolean', kind: 'expression' },
      { label: 'Show break handle', kind: 'toggle' },
    ],
  },
  script: { fields: [{ label: 'Code', value: '//', kind: 'textarea', required: true }] },
  'wait-message': {
    fields: [
      { label: 'Conversation ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'From', value: 'User', kind: 'select' },
      { label: 'Number of exchanges', value: '20' },
    ],
  },
  'conversation-context': {
    fields: [
      { label: 'Conversation ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Exchange limit', value: '20' },
    ],
  },
  'send-message': {
    fields: [
      { label: 'Conversation ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Exchange ID', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'End exchange after writing', kind: 'checkbox' },
      { label: 'Content', value: '$vars.flowTest', kind: 'expression', required: true },
      { label: 'Mimetype', value: 'text/markdown' },
    ],
  },
  'queue-create': {
    fields: [{ label: 'Queue', value: 'Select a queue', kind: 'select', required: true }],
  },
  'queue-create-wait': {
    fields: [{ label: 'Queue', value: 'Select a queue', kind: 'select', required: true }],
  },
  'outgoing-call': {
    fields: [
      { label: 'From', value: 'Select a connected number...', kind: 'select', required: true },
      { label: 'To', value: '$vars.flowTest', kind: 'expression', required: true },
    ],
  },
  'end-call': {
    fields: [
      { label: 'Call context', value: '$vars.flowTest', kind: 'expression', required: true },
    ],
  },
  'manual-trigger': {
    description: 'Define input arguments provided when this trigger starts the flow.',
    action: 'Add input argument',
  },
  'scheduled-trigger': {
    fields: [
      { label: 'Frequency', value: 'Hourly', kind: 'select', required: true },
      { label: 'Every', value: '1' },
      { label: 'At minute', value: '0', kind: 'select' },
    ],
  },
  'slack-trigger': {
    fields: [{ label: 'Slack connection', value: 'carl.schultze', kind: 'select', required: true }],
  },
  'http-webhook': {
    fields: [
      { label: 'HTTP Webhook connection', value: 'Flow Test', kind: 'select', required: true },
    ],
  },
  'incoming-call': { empty: true },
  'conversation-trigger': { empty: true },
  delay: {
    fields: [
      { label: 'Type', value: 'Duration', kind: 'select', required: true },
      { label: 'Duration', value: '15 minutes', kind: 'select', required: true },
    ],
  },
  'webhook-wait': {
    fields: [
      { label: 'HTTP Webhook connection', value: 'Flow Test', kind: 'select', required: true },
    ],
  },
  'email-wait': {
    fields: [
      { label: 'Gmail connection', value: 'Select a connection', kind: 'select', required: true },
    ],
  },
  subflow: {
    section: 'Inputs',
    description:
      'Define input variables for this subflow and map expressions from the parent scope.',
    action: 'Add input variable',
  },
  bpmn: { empty: true },
  case: {
    fields: [
      {
        label: 'Enable fire and forget',
        helper: 'Start the run without waiting for it to finish.',
        kind: 'toggle',
      },
    ],
  },
  'api-workflow': { empty: true },
};

export function InventoryPanelField({ field }: { field: InventoryField }) {
  const fieldId = `inventory-field-${field.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (field.kind === 'toggle' || field.kind === 'checkbox') {
    return (
      <div className="flex items-start justify-between gap-3 py-1">
        <div>
          <Label className="text-xs" htmlFor={fieldId}>
            {field.label}
          </Label>
          {field.helper && (
            <p className="mt-0.5 text-[11px] text-foreground-muted">{field.helper}</p>
          )}
        </div>
        {field.kind === 'toggle' ? <Switch id={fieldId} /> : <Checkbox id={fieldId} />}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs" htmlFor={fieldId}>
        {field.label}
        {field.required && <RequiredIndicator />}
      </Label>
      {field.kind === 'select' ? (
        <Select defaultValue="current">
          <SelectTrigger id={fieldId} className="h-9 w-full bg-surface-overlay text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">{field.value}</SelectItem>
          </SelectContent>
        </Select>
      ) : field.kind === 'textarea' ? (
        <Textarea
          id={fieldId}
          defaultValue={field.value}
          className="min-h-24 resize-none bg-surface-overlay text-xs"
        />
      ) : field.kind === 'expression' ? (
        <div className="flex items-center rounded-lg border border-border-subtle bg-surface-overlay px-2 focus-within:border-border-focus">
          <span className="mr-1.5 font-mono text-xs text-foreground-subtle">=</span>
          <Input
            id={fieldId}
            defaultValue={field.value}
            className="border-0 bg-transparent px-0 font-mono text-xs text-foreground-accent shadow-none focus-visible:ring-0"
          />
        </div>
      ) : (
        <Input id={fieldId} defaultValue={field.value} className="h-9 bg-surface-overlay text-xs" />
      )}
      {field.helper && <p className="text-[11px] text-foreground-muted">{field.helper}</p>}
    </div>
  );
}

export function NodeInventoryPanel({
  item,
  onClose,
}: {
  item: NodeInventoryItem;
  onClose?: () => void;
}) {
  const spec = NODE_PANEL_SPECS[item.id];
  return (
    <NodePropertyPanel
      panelTitle="Properties"
      nodeIcon={<CanvasIcon icon={item.icon} size={22} />}
      nodeLabel={item.label}
      nodeCategory={item.category}
      onClose={onClose}
      contentInset="0.875rem"
      className="h-full"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Tabs defaultValue="parameters" className="flex min-h-0 flex-1 flex-col">
          <TabsList className={VARIABLE_TAB_LIST_CLASS}>
            <TabsTrigger value="parameters" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Parameters
            </TabsTrigger>
            <TabsTrigger value="errors" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Error handling
            </TabsTrigger>
            <TabsTrigger value="advanced" className={VARIABLE_TAB_TRIGGER_CLASS}>
              Advanced
            </TabsTrigger>
          </TabsList>
          <TabsContent value="parameters" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
            <div className="space-y-4">
              <p className="text-xs leading-5 text-foreground-muted">
                Configure what this node does when the workflow runs.
              </p>
              {spec?.section && (
                <p className="text-xs font-semibold text-foreground">{spec.section}</p>
              )}
              {spec?.description && (
                <p className="text-xs leading-5 text-foreground-muted">{spec.description}</p>
              )}
              {spec?.empty && (
                <p className="text-xs text-foreground-muted">No available parameters</p>
              )}
              {spec?.fields?.map((field) => (
                <InventoryPanelField key={field.label} field={field} />
              ))}
              {spec?.action && (
                <Button
                  size="sm"
                  variant={spec.action.startsWith('Add') ? 'ghost' : 'outline'}
                  className={
                    spec.action.startsWith('Add')
                      ? 'h-7 px-2 text-xs font-semibold text-brand hover:text-brand'
                      : 'h-8 text-xs'
                  }
                >
                  {spec.action.startsWith('Add') && <Plus size={14} />}
                  {spec.action}
                </Button>
              )}
              {!spec && (
                <p className="text-xs text-foreground-muted">
                  No Figma reference is available for this node yet.
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="errors" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
            <p className="text-xs leading-5 text-foreground-muted">
              Configure retry, timeout, and error continuation behavior for this node.
            </p>
          </TabsContent>
          <TabsContent value="advanced" className="mt-0 min-h-0 flex-1 overflow-auto p-3">
            <p className="text-xs leading-5 text-foreground-muted">
              Advanced execution settings are available when supported by this node.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </NodePropertyPanel>
  );
}
