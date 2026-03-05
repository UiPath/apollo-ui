import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider } from './slider';
import { Label } from './label';

const meta: Meta<typeof Slider> = {
  title: 'Components/Core/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-2">
        <Label>Volume</Label>
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>
    </div>
  ),
};

// ============================================================================
// Range Slider
// ============================================================================

export const RangeSlider = {
  name: 'Range Slider',
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-2">
        <Label>Select a range</Label>
        <Slider defaultValue={[25, 75]} max={100} step={1} />
      </div>
    </div>
  ),
};

// ============================================================================
// Slider with Steps
// ============================================================================

export const SliderWithSteps = {
  name: 'Slider with Steps',
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-2">
        <Label>Steps of 10</Label>
        <Slider defaultValue={[30]} max={100} step={10} />
      </div>
      <div className="space-y-2">
        <Label>Steps of 25</Label>
        <Slider defaultValue={[50]} max={100} step={25} />
      </div>
    </div>
  ),
};

// ============================================================================
// Examples — Price Range Filter
// ============================================================================

export const PriceRangeFilter = {
  name: 'Price Range Filter',
  render: () => {
    const [value, setValue] = useState([100, 400]);
    const min = 0;
    const max = 500;

    const formatPrice = (val: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);

    return (
      <div className="w-[300px] space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Price range</Label>
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatPrice(value[0])} – {formatPrice(value[1])}
            </span>
          </div>
          <Slider
            value={value}
            min={min}
            max={max}
            step={25}
            onValueChange={setValue}
          />
        </div>
      </div>
    );
  },
};
