import type { NodeManifest } from '../../schema';
import { RUNTIME_CONTAINER_KIND } from '../../utils/container';

/**
 * Story-local manifests for the runtime container stories. Passed through `extraManifests`
 * (or a story registration), never merged into the shared default manifest set.
 *
 * The runtime container is a self-contained subflow expanded inline: outer input and output
 * handles only, no inner start or continue rail, and no header badge.
 */
export const RUNTIME_CONTAINER_NODE_TYPE = 'uipath.runtime-container';

export const runtimeContainerManifests: NodeManifest[] = [
  {
    nodeType: RUNTIME_CONTAINER_NODE_TYPE,
    version: '1',
    category: 'control-flow',
    tags: ['runtime', 'subflow', 'container'],
    sortOrder: 4,
    description: 'Runs a self-contained subflow inline',
    display: {
      label: 'Runtime container',
      icon: 'repeat',
      shape: 'container',
      container: {
        kind: RUNTIME_CONTAINER_KIND,
        badge: false,
        bodyFrame: 'dashed',
      },
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
    nodeType: 'uipath.javascript',
    version: '1',
    category: 'data-operations',
    tags: ['script', 'javascript', 'code'],
    sortOrder: 6,
    description: 'Run a JavaScript snippet',
    display: { label: 'Javascript', icon: 'code' },
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
    category: 'human-task',
    tags: ['message', 'notify', 'user'],
    sortOrder: 7,
    description: 'Send a message to the user',
    display: {
      label: 'Send Message to User',
      icon: 'send',
      iconBackground: 'var(--color-purple-600)',
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
