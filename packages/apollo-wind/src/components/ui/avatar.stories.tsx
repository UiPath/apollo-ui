import type { Meta } from '@storybook/react-vite';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Data Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

// ============================================================================
// Fallback
// ============================================================================

export const Fallback = {
  name: 'Fallback',
  render: () => (
    <div className="flex items-center gap-4">
      {/* No image source, fallback renders immediately */}
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      {/* Broken image source, fallback renders after the image fails to load */}
      <Avatar>
        <AvatarImage src="https://example.invalid/broken.png" alt="Broken image" />
        <AvatarFallback>AW</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// ============================================================================
// Sizes
// ============================================================================

export const Sizes = {
  name: 'Sizes',
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="default">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="lg">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">lg</span>
      </div>
    </div>
  ),
};

// ============================================================================
// Fallback Sizes
// ============================================================================

export const FallbackSizes = {
  name: 'Fallback Sizes',
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// ============================================================================
// Examples
// ============================================================================

export const Examples = {
  name: 'Examples',
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Avatar group */}
      <div>
        <p className="text-sm font-medium mb-3">Avatar Group</p>
        <div className="flex -space-x-2">
          <Avatar className="ring-2 ring-background">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="ring-2 ring-background">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="ring-2 ring-background">
            <AvatarFallback>AW</AvatarFallback>
          </Avatar>
          <Avatar className="ring-2 ring-background">
            <AvatarFallback>+3</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* With user details */}
      <div>
        <p className="text-sm font-medium mb-3">With User Details</p>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Jane Smith</span>
            <span className="text-xs text-muted-foreground">jane.smith@uipath.com</span>
          </div>
        </div>
      </div>
    </div>
  ),
};
