# Contributing to Apollo Wind

Thank you for your interest in contributing to Apollo Wind! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/wind.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Running the Development Environment

```bash
# Start Storybook for component development
npm run storybook

# Run tests in watch mode
npm test

# Run linter
npm run lint
```

### Project Structure

```
apw/
├── src/
│   ├── components/
│   │   └── ui/          # UI components
│   ├── lib/             # Utility functions
│   └── styles/          # Global styles
├── tests/               # Test configuration
├── .storybook/          # Storybook configuration
└── dist/                # Build output
```

## Adding a New Component

1. **Create the component file** in `src/components/ui/`
2. **Use the shadcn/ui pattern** as a base
3. **Add TypeScript types** for all props
4. **Use class-variance-authority** for variants
5. **Export from index.ts**

Example:

```tsx
// src/components/ui/new-component.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "default-styles",
      // Add more variants
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(componentVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Component.displayName = "Component";

export { Component, componentVariants };
```

## Writing Tests

Every component should have corresponding tests:

```tsx
// src/components/ui/new-component.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Component } from "./new-component";

describe("Component", () => {
  it("renders correctly", () => {
    render(<Component>Test</Component>);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Component variant="custom">Test</Component>);
    // Add assertions
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Component ref={ref}>Test</Component>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
```

## Writing Stories

Create Storybook stories for visual testing:

```tsx
// src/components/ui/new-component.stories.tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component } from "./new-component";

const meta = {
  title: "Components/Component",
  component: Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Component",
  },
};
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types for all props
- Avoid using `any` type
- Use `interface` for props, `type` for other definitions

### React

- Use functional components with hooks
- Use `React.forwardRef` for components that need ref forwarding
- Set `displayName` for all components

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility for combining classes
- Follow existing color and spacing conventions
- Ensure responsive design with breakpoint utilities

### Accessibility

- Follow WAI-ARIA guidelines
- Include proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers when possible

## Testing Requirements

- All components must have unit tests
- Aim for >80% code coverage
- Test accessibility features
- Test all variants and sizes

Run tests before committing:

```bash
npm run test:coverage
```

## Commit Guidelines

We follow conventional commits:

- `feat(apollo-wind):` - New feature
- `fix(apollo-wind):` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `feat(apollo-wind):` - Maintenance tasks

Example:

```bash
git commit -m "feat(apollo-wind): add tooltip component"
git commit -m "fix(apollo-wind): button focus state on Safari"
```

## Pull Request Process

1. **Update your branch** with the latest main branch
2. **Run all tests** and ensure they pass
3. **Run the linter** and fix any issues
4. **Update documentation** if needed
5. **Create a pull request** with a clear description
6. **Link any related issues**
7. **Request review** from maintainers

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Storybook stories added/updated
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Code follows project conventions
- [ ] Commits follow conventional commits
- [ ] PR description is clear and complete

## Questions?

If you have questions, please:

1. Check existing documentation
2. Search through issues
3. Create a new issue with the `question` label

## License

By contributing to Apollo Wind, you agree that your contributions will be licensed under the MIT License.
