import type { Meta, StoryFn } from '@storybook/react';
import { Column, Row } from '../../layouts';
import { TaskIcon } from './TaskIcon';
import type { TaskIconSize } from './TaskIcon.types';
import { TaskItemTypeValues } from './TaskIcon.types';

export default {
  title: 'Canvas/TaskIcon',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

const SIZES: TaskIconSize[] = ['sm', 'md', 'lg'];

export const Default: StoryFn = () => {
  return (
    <Column
      p={40}
      gap={24}
      minH="100vh"
      style={{ background: 'var(--uix-canvas-background)', color: 'var(--uix-canvas-foreground)' }}
    >
      <Column gap={36}>
        <Row gap={36}>
          <Column w={140} />
          {SIZES.map((size) => (
            <Column key={size} w={72} align="center">
              <span style={{ fontSize: '14px' }}>{size}</span>
            </Column>
          ))}
        </Row>
        {Object.values(TaskItemTypeValues).map((type) => (
          <Row key={type} gap={36} align="center">
            <Column w={140}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{type}</span>
            </Column>
            {SIZES.map((size) => (
              <Column key={size} w={72} align="center">
                <TaskIcon type={type} size={size} />
              </Column>
            ))}
          </Row>
        ))}
      </Column>
    </Column>
  );
};
