import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar } from './calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Components/UiPath-review/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
    );
  },
};
