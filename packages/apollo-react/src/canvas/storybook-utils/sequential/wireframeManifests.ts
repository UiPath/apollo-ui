import type { NodeManifest } from '../../schema';

/**
 * Manifests for the two `utils/sequential/fixtures.ts` `makeWireframeFixture`
 * node types that have no other Storybook registration: "HTTP Request" and
 * "Send Message to User". `uipath.script`, `uipath.control-flow.foreach`, and
 * `uipath.control-flow.decision` (the fixture's other three types) already
 * exist in storybook-utils/manifests/node-definitions.ts.
 *
 * BaseNode renders `MissingManifestNode` whenever no manifest resolves for a
 * node's `type` (BaseNode.tsx, the `if (!manifest)` branch, checked before the
 * card/bar split), so these two are required for the wireframe story to show
 * realistic icons rather than the missing-manifest placeholder. Kept as an
 * additive array passed to SequentialCanvasStoryHarness's `extraManifests`
 * (never merged into the shared `defaultWorkflowManifest`) so no other canvas
 * story is affected.
 *
 * Both manifests also carry `display.iconBackground` so BaseNodeBar's colored
 * left accent strip (gated on that field, see BaseNodeBar.tsx) is exercised in
 * the Wireframe story: the Send Message node uses Slack's brand purple (the
 * connector it represents), and the HTTP Request node uses a distinct token
 * hue so the two branded/integration bars are visually differentiated.
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
