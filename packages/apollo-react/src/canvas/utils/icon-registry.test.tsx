import { describe, expect, it } from 'vitest';
// Path matches the existing convention used by adjacent tests in this folder.
import { getIcon } from './icon-registry';
import { render } from './testing';

describe('getIcon', () => {
  // Manifest schemas now allow `display.icon` to be omitted; the registry must
  // tolerate `undefined`/empty input and return a renderable fallback so
  // callers don't have to special-case the missing path.
  it('returns a renderable fallback IconComponent for undefined input', () => {
    const Icon = getIcon(undefined);
    const { container } = render(<Icon w={24} h={24} />);
    // Fallback is a Box icon (lucide). Just assert *something* renders.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns a renderable fallback IconComponent for empty-string input', () => {
    const Icon = getIcon('');
    const { container } = render(<Icon w={24} h={24} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('returns a registered Lucide icon by kebab-case name', () => {
    const Icon = getIcon('star');
    const { container } = render(<Icon w={24} h={24} />);
    // Lucide tags its rendered SVGs with a `lucide-<name>` class.
    expect(container.querySelector('svg')).toHaveClass('lucide-star');
  });

  it('returns an <img> renderer for valid http(s) URLs', () => {
    const Icon = getIcon('https://example.com/icon.svg');
    const { container } = render(<Icon w={24} h={24} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/icon.svg');
  });

  it('returns the CaseManagementProject icon for the registered case-management id', () => {
    const Icon = getIcon('case-management');
    const { container } = render(<Icon w={24} h={24} />);
    // The registered UIPath icon renders its own SVG (id), not a Lucide fallback.
    expect(container.querySelector('#case-management-project')).toBeInTheDocument();
  });

  it('returns the LayersArrowUpRight icon for the registered layers-arrow-up-right id', () => {
    const Icon = getIcon('layers-arrow-up-right');
    const { container } = render(<Icon w={24} h={24} />);
    // The registered UIPath icon renders its own SVG (class), not a Lucide/Box fallback
    // (there is no Lucide `LayersArrowUpRight`, so a miss here would degrade to Box).
    const svg = container.querySelector('svg.layers-arrow-up-right-icon');
    expect(svg).toBeInTheDocument();
    // The two accent-on-hover arrow sub-paths are present.
    expect(svg?.querySelectorAll('path.arrow')).toHaveLength(2);
  });
});
