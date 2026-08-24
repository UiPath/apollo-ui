import type { Meta, StoryObj } from '@storybook/react-vite';
import { NodePatternComposition } from '../../../../packages/apollo-react/src/canvas/stories/templates/Flow.stories';
import { withCanvasProviders } from '../../../../packages/apollo-react/src/canvas/storybook-utils';

const meta = {
  title: 'Apollo Wind/Patterns/Node Patterns',
  parameters: { layout: 'fullscreen' },
  decorators: [withCanvasProviders({ fullscreen: false })],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const nodePattern = (nodeId: string, name: string): Story => ({
  name,
  render: () => <NodePatternComposition nodeId={nodeId} />,
});

export const AutonomousAgent = nodePattern('autonomous-agent', 'Agents · Autonomous agent');
export const ConversationalAgent = nodePattern(
  'conversational-agent',
  'Agents · Conversational agent'
);
export const VoiceAgent = nodePattern('voice-agent', 'Agents · Voice agent');

export const Escalation = nodePattern('escalation', 'Agent resources · Escalation');
export const QuickFormEscalation = nodePattern(
  'quick-form-escalation',
  'Agent resources · Quick Form escalation'
);
export const ActionAppEscalation = nodePattern(
  'action-app-escalation',
  'Agent resources · Action App escalation'
);

export const HttpRequest = nodePattern('http-request-v2', 'Connectors · HTTP Request');
export const SlackSendMessage = nodePattern('slack-send', 'Connectors · Send Message');

export const BatchTransform = nodePattern('batch-transform', 'Data · Batch transform');
export const Filter = nodePattern('filter', 'Data · Filter');
export const GroupBy = nodePattern('group-by', 'Data · Group by');
export const DataMap = nodePattern('map', 'Data · Map');
export const Transform = nodePattern('transform', 'Data · Transform');
export const ReadEntity = nodePattern('read-entity', 'Data · Read entity');
export const UpdateEntity = nodePattern('update-entity', 'Data · Update entity');

export const Summarize = nodePattern('summarize', 'Document · Summarize');
export const Extract = nodePattern('extract', 'Document · Extract');
export const Classify = nodePattern('classify', 'Document · Classify');
export const DocumentValidation = nodePattern(
  'document-validation',
  'Document · Document Validation'
);
export const AnalyzeFiles = nodePattern('analyze-files', 'Document · Analyze Files');

export const QuickForm = nodePattern('quick-form', 'Human · Quick Form');
export const ActionApp = nodePattern('action-app', 'Human · Action App');
export const HumanTask = nodePattern('human-task', 'Human · Human Task');

export const Mock = nodePattern('mock', 'Control · Mock');
export const Decision = nodePattern('decision', 'Control · Decision');
export const Switch = nodePattern('switch', 'Control · Switch');
export const Merge = nodePattern('merge', 'Control · Merge');
export const End = nodePattern('end', 'Control · End');
export const Terminate = nodePattern('terminate', 'Control · Terminate');
export const DoWhile = nodePattern('do-while', 'Control · Do while');
export const Loop = nodePattern('loop', 'Control · Loop');

export const Script = nodePattern('script', 'Tool · Script');
export const WaitForMessage = nodePattern('wait-message', 'Tool · Wait for message');
export const GetConversationContext = nodePattern(
  'conversation-context',
  'Tool · Get conversation context'
);
export const SendMessage = nodePattern('send-message', 'Tool · Send message');
export const CreateQueueItem = nodePattern('queue-create', 'Tool · Create queue item');
export const CreateAndWaitForQueueItem = nodePattern(
  'queue-create-wait',
  'Tool · Create and wait for queue item'
);
export const CreateOutgoingCall = nodePattern('outgoing-call', 'Tool · Create outgoing call');
export const EndCall = nodePattern('end-call', 'Tool · End call');
export const ClientSideTool = nodePattern('client-side-tool', 'Tool · Client-side tool');

export const ManualTrigger = nodePattern('manual-trigger', 'Triggers · Manual trigger');
export const ScheduledTrigger = nodePattern('scheduled-trigger', 'Triggers · Scheduled trigger');
export const SlackMessageReceived = nodePattern(
  'slack-trigger',
  'Triggers · Message Received in Slack'
);
export const HttpWebhook = nodePattern('http-webhook', 'Triggers · HTTP Webhook');
export const IncomingCall = nodePattern('incoming-call', 'Triggers · Incoming call');
export const ConversationTrigger = nodePattern(
  'conversation-trigger',
  'Triggers · Conversation trigger'
);
export const FormTrigger = nodePattern('form-trigger', 'Triggers · Form trigger');

export const Delay = nodePattern('delay', 'Wait for event · Delay');
export const HttpWebhookCallback = nodePattern(
  'webhook-wait',
  'Wait for event · HTTP Webhook callback'
);
export const EmailReceivedWait = nodePattern(
  'email-wait',
  'Wait for event · Email Received (Wait)'
);

export const Subflow = nodePattern('subflow', 'UiPath · Subflow');
export const Flow = nodePattern('flow', 'UiPath · Flow');
export const Bpmn = nodePattern('bpmn', 'UiPath · BPMN');
export const Case = nodePattern('case', 'UiPath · Case');
export const RpaWorkflow = nodePattern('rpa-workflow', 'UiPath · RPA Workflow');
export const ApiWorkflow = nodePattern('api-workflow', 'UiPath · API Workflow');
