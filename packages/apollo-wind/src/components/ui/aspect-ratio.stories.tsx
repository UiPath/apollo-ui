import type { Meta } from '@storybook/react-vite';
import { AspectRatio } from './aspect-ratio';
import { Row } from './layout';

const meta: Meta<typeof AspectRatio> = {
  title: 'Components/Layout/Aspect Ratio',
  component: AspectRatio,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => (
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          className="h-full w-full rounded-md object-cover"
        />
      </AspectRatio>
    </div>
  ),
};

export const Square = {
  args: {},
  render: () => (
    <div className="w-[300px]">
      <AspectRatio ratio={1 / 1} className="bg-muted">
        <Row h="full" justify="center" align="center">
          <p className="text-muted-foreground">1:1 Square</p>
        </Row>
      </AspectRatio>
    </div>
  ),
};
