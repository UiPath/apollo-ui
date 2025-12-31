import type { Meta } from '@storybook/react-vite';
import { toast } from 'sonner';
import { Button } from './button';
import { Toaster } from './sonner';

const meta: Meta<typeof Toaster> = {
  title: 'Design System/Feedback/Sonner',
  component: Toaster,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <>
      <Toaster />
      <div className="space-x-2">
        <Button
          variant="outline"
          onClick={() =>
            toast('Event has been created', {
              description: 'Sunday, December 03, 2023 at 9:00 AM',
            })
          }
        >
          Show Toast
        </Button>
        <Button variant="outline" onClick={() => toast.success('Success message')}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error('Error message')}>
          Error
        </Button>
      </div>
    </>
  ),
};
