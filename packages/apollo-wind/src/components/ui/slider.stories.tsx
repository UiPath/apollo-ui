import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { FormFieldError } from './form-field';
import { Label } from './label';
import { Slider } from './slider';

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
          <Slider value={value} min={min} max={max} step={25} onValueChange={setValue} />
        </div>
      </div>
    );
  },
};

export const WithInlineValidation = {
  render: () => (
    <div className="grid w-[320px] gap-1.5">
      <Label id="slider-retries-label">Retry count</Label>
      <Slider
        aria-labelledby="slider-retries-label"
        aria-invalid
        aria-describedby="slider-retries-error"
        aria-errormessage="slider-retries-error"
        defaultValue={[8]}
        max={10}
        step={1}
      />
      <FormFieldError id="slider-retries-error">
        Retry count must be between 0 and 5.
      </FormFieldError>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Slider forwards `aria-invalid`, `aria-describedby`, `aria-errormessage` and `aria-labelledby` to its thumb, which is the element with `role="slider"`, and the thumb takes the red stroke. Render `FormFieldError` below and point `aria-describedby` and `aria-errormessage` at its id.',
      },
    },
  },
};
