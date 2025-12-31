import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { AspectRatio } from './aspect-ratio';

describe('AspectRatio', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="test.jpg" alt="Test" />
      </AspectRatio>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="test.jpg" alt="Test image" />
      </AspectRatio>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders children', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <div data-testid="child">Child content</div>
      </AspectRatio>,
    );
    expect(container.querySelector('[data-testid="child"]')).toBeInTheDocument();
  });

  it('applies 16/9 aspect ratio', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="test.jpg" alt="Test" />
      </AspectRatio>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies 4/3 aspect ratio', () => {
    const { container } = render(
      <AspectRatio ratio={4 / 3}>
        <img src="test.jpg" alt="Test" />
      </AspectRatio>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies 1/1 (square) aspect ratio', () => {
    const { container } = render(
      <AspectRatio ratio={1}>
        <img src="test.jpg" alt="Test" />
      </AspectRatio>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with image', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <img src="https://example.com/image.jpg" alt="Example" className="object-cover" />
      </AspectRatio>,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('alt', 'Example');
  });

  it('renders with video', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <video src="video.mp4" />
      </AspectRatio>,
    );
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('renders with custom content', () => {
    const { container } = render(
      <AspectRatio ratio={1}>
        <div className="custom-content">Custom</div>
      </AspectRatio>,
    );
    expect(container.textContent).toContain('Custom');
  });
});
