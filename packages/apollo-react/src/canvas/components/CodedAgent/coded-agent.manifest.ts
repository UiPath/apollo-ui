import type { WorkflowManifest } from '../../schema/node-definition';

export const codedAgentManifest: WorkflowManifest = {
  version: '1.0.0',
  categories: [
    {
      id: 'coded-agent',
      name: 'Coded Agent',
      sortOrder: 1,
      color: '#6c757d',
      colorDark: '#495057',
      icon: 'code',
      tags: [],
    },
  ],
  nodes: [
    {
      nodeType: 'uipath.coded.agent',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['agent', 'coded'],
      sortOrder: 1,
      display: {
        label: '',
        icon: 'code',
        shape: 'rectangle',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            {
              id: 'left',
              type: 'target',
              handleType: 'artifact',
              showButton: false,
            },
          ],
          visible: true,
        },
        {
          position: 'right',
          handles: [
            {
              id: 'right',
              type: 'source',
              handleType: 'artifact',
              showButton: false,
            },
          ],
          visible: true,
        },
      ],
    },
    {
      nodeType: 'uipath.coded.resource',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['resource', 'coded'],
      sortOrder: 2,
      display: {
        label: '',
        icon: 'chat',
        shape: 'circle',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            {
              id: 'left',
              type: 'target',
              handleType: 'artifact',
              showButton: false,
            },
          ],
          visible: true,
        },
        {
          position: 'right',
          handles: [
            {
              id: 'right',
              type: 'source',
              handleType: 'artifact',
              showButton: false,
            },
          ],
          visible: true,
        },
      ],
    },
    {
      nodeType: 'uipath.coded.flow.start',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['flow', 'start'],
      sortOrder: 3,
      display: {
        label: '',
        icon: 'circle',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'right',
          handles: [
            {
              id: 'right',
              type: 'source',
              handleType: 'output',
              showButton: false,
            },
          ],
          visible: true,
        },
      ],
    },
    {
      nodeType: 'uipath.coded.flow.end',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['flow', 'end'],
      sortOrder: 4,
      display: {
        label: '',
        icon: 'circle',
        shape: 'square',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            {
              id: 'left',
              type: 'target',
              handleType: 'input',
              showButton: false,
            },
          ],
          visible: true,
        },
      ],
    },
    {
      nodeType: 'uipath.coded.flow.node',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['flow', 'node'],
      sortOrder: 5,
      display: {
        label: '',
        icon: '',
        shape: 'rectangle',
      },
      handleConfiguration: [
        {
          position: 'left',
          handles: [
            {
              id: 'left',
              type: 'target',
              handleType: 'artifact',
              showButton: false,
            },
          ],
          visible: true,
        },
        {
          position: 'right',
          handles: [
            {
              id: 'right',
              type: 'source',
              handleType: 'artifact',
              showButton: false,
            },
          ],
          visible: true,
        },
      ],
    },
  ],
};
