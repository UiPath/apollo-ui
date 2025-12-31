import type { Meta } from '@storybook/react-vite';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { Row, Column } from './layout';

const meta = {
  title: 'Design System/Feedback/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;

export const Default = {
  args: {},
  render: () => <Skeleton className="h-12 w-[250px]" />,
};

export const Circle = {
  args: {},
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
};

export const CardSkeleton = {
  args: {},
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Column gap={2}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[80%]" />
        </Column>
      </CardContent>
    </Card>
  ),
};

export const ProfileSkeleton = {
  args: {},
  render: () => (
    <Row gap={4} align="center">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Column gap={2}>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </Column>
    </Row>
  ),
};

export const ListSkeleton = {
  args: {},
  render: () => (
    <Column gap={4} className="w-[350px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Row key={i} gap={4} align="center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Column flex={1} gap={2}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Column>
        </Row>
      ))}
    </Column>
  ),
};

export const TableSkeleton = {
  args: {},
  render: () => (
    <Column gap={3} className="w-[600px]">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </Column>
  ),
};
