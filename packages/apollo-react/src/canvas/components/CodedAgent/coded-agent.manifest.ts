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
        label: 'Coded Agent Step',
        icon: 'code',
        shape: 'rectangle',
      },
      handleConfiguration: [],
    },
    {
      nodeType: 'uipath.coded.resource',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['resource', 'coded'],
      sortOrder: 2,
      display: {
        label: 'Coded Resource',
        icon: 'chat',
        shape: 'circle',
      },
      handleConfiguration: [],
    },
    {
      nodeType: 'uipath.coded.flow.start',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['flow', 'start'],
      sortOrder: 3,
      display: {
        label: 'Start',
        icon: 'circle',
        shape: 'square',
      },
      handleConfiguration: [],
    },
    {
      nodeType: 'uipath.coded.flow.end',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['flow', 'end'],
      sortOrder: 4,
      display: {
        label: 'End',
        icon: 'trip_origin',
        shape: 'square',
      },
      handleConfiguration: [],
    },
    {
      nodeType: 'uipath.coded.flow.node',
      version: '1.0.0',
      category: 'coded-agent',
      tags: ['flow', 'node'],
      sortOrder: 5,
      display: {
        label: 'Flow Node',
        icon: 'square',
        shape: 'rectangle',
      },
      handleConfiguration: [],
    },
  ],
};
