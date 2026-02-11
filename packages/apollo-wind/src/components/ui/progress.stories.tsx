import type { Meta } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Feedback/Progress',
  component: Progress,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => <Progress value={33} className="w-[60%]" />,
};

export const Indeterminate = {
  args: {},
  render: () => <Progress value={undefined} className="w-[60%]" />,
};

export const Animated = {
  args: {},
  render: () => {
    const [progress, setProgress] = useState(13);

    useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }, []);

    return <Progress value={progress} className="w-[60%]" />;
  },
};
