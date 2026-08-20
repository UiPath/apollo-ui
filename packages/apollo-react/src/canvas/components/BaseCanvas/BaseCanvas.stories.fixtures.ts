import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { createNode } from '../../storybook-utils';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';

export function createConnectionComparisonNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: 'connection-source',
      type: 'uipath.blank-node',
      position: { x: 0, y: 0 },
      display: { label: 'Submit expense' },
      handleConfigurations: [
        {
          position: Position.Right,
          handles: [
            {
              id: `out-${Position.Right}`,
              type: 'source',
              handleType: 'output',
            },
          ],
        },
      ],
    }),
    createNode({
      id: 'connection-target',
      type: 'uipath.blank-node',
      position: { x: 320, y: 0 },
      display: { label: 'Review expense' },
      handleConfigurations: [
        {
          position: Position.Left,
          handles: [
            {
              id: `in-${Position.Left}`,
              type: 'target',
              handleType: 'input',
            },
          ],
        },
      ],
    }),
  ];
}
