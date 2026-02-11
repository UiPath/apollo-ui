import type { Meta } from '@storybook/react-vite';
import { Slider } from './slider';

const meta: Meta<typeof Slider> = {
  title: 'Components/Core/Slider',
  component: Slider,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Slider defaultValue={[33]} max={100} step={1} />
    </div>
  ),
};

export const WithRange = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <Slider defaultValue={[25, 75]} max={100} step={1} />
    </div>
  ),
};
