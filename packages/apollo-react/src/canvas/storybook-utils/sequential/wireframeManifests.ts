import type { NodeManifest } from '../../schema';

/**
 * Manifests for the two makeWireframeFixture node types with no other Storybook
 * registration (BaseNode would render MissingManifestNode). Passed through
 * `extraManifests`, never merged into defaultWorkflowManifest. Both set
 * `display.iconBackground` so the bar's left accent strip is exercised.
 */
export const sequentialWireframeManifests: NodeManifest[] = [
  {
    nodeType: 'uipath.http-request',
    version: '1',
    category: 'connector',
    tags: ['http', 'request', 'api', 'connector'],
    sortOrder: 5,
    description: 'Call an external HTTP API and capture the response',
    display: {
      label: 'HTTP Request',
      icon: 'globe',
      iconBackground: 'var(--color-blue-500)',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
      },
    ],
  },
  {
    nodeType: 'uipath.send-message',
    version: '1',
    category: 'connector',
    tags: ['send', 'message', 'notify', 'connector'],
    sortOrder: 6,
    description: 'Send a message to a user through a configured channel',
    display: {
      label: 'Send Message to User',
      icon: 'send',
      // Slack brand purple: this node represents a Slack-style message connector.
      iconBackground: '#611f69',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
      },
    ],
  },
];
