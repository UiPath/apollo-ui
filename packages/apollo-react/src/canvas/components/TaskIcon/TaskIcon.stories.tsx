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

const TASK_TYPE_INFO = [
  { type: TaskItemTypeValues.Agent, label: 'Agent' },
  { type: TaskItemTypeValues.Automation, label: 'RPA automation' },
  { type: TaskItemTypeValues.ApiAutomation, label: 'API automation' },
  { type: TaskItemTypeValues.User, label: 'Human in the loop' },
  { type: TaskItemTypeValues.AgenticProcess, label: 'Agentic process' },
];

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
        {TASK_TYPE_INFO.map(({ type, label }) => (
          <Row key={type} gap={36} align="center">
            <Column w={140}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
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
