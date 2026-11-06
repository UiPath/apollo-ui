import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useRowHover } from './useRowHover';

const rowTopPx = (index: number) => 40 + index * 30;

const Table = ({ active = true }: { active?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  useRowHover(containerRef, overlayRef, rowTopPx, active);
  return (
    <div ref={containerRef} data-testid="container">
      <div ref={overlayRef} data-testid="overlay" />
      <table>
        <tbody>
          <tr>
            <td data-row={0} data-testid="row-0" />
          </tr>
          <tr>
            <td data-row={2} data-testid="row-2" />
          </tr>
          <tr>
            <td data-row={3} data-testid="row-3" />
            <td data-editing="true" />
          </tr>
          <tr>
            <td data-testid="spacer" />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const overlay = () => screen.getByTestId('overlay');
const hover = (testId: string, pointerType = 'mouse') =>
  fireEvent.pointerOver(screen.getByTestId(testId), { pointerType });

describe('useRowHover', () => {
  it("moves the overlay to the hovered data row's top", () => {
    render(<Table />);

    hover('row-2');

    expect(overlay().style.display).toBe('');
    expect(overlay().style.transform).toBe(`translateY(${rowTopPx(2)}px)`);
  });

  it('hides the overlay over a row with an open editor', () => {
    render(<Table />);
    hover('row-0');

    hover('row-3');

    expect(overlay().style.display).toBe('none');
  });

  it('hides the overlay over a row with no data cell', () => {
    render(<Table />);
    hover('row-0');

    hover('spacer');

    expect(overlay().style.display).toBe('none');
  });

  it('ignores touch, which has no hover', () => {
    render(<Table />);

    hover('row-2', 'touch');

    expect(overlay().style.transform).toBe('');
  });

  it('hides the overlay once the pointer leaves the table', () => {
    render(<Table />);
    hover('row-2');

    fireEvent.pointerOut(screen.getByTestId('row-2'), { relatedTarget: document.body });

    expect(overlay().style.display).toBe('none');
  });

  it('hides the overlay while the hovered row opens an editor, and brings it back after', async () => {
    render(<Table />);
    hover('row-2');

    screen.getByTestId('row-2').setAttribute('data-editing', 'true');
    await waitFor(() => expect(overlay().style.display).toBe('none'));

    screen.getByTestId('row-2').removeAttribute('data-editing');
    await waitFor(() => expect(overlay().style.display).toBe(''));
    expect(overlay().style.transform).toBe(`translateY(${rowTopPx(2)}px)`);
  });

  it('keeps the overlay hidden while inactive', () => {
    render(<Table active={false} />);

    hover('row-2');

    expect(overlay().style.display).toBe('none');
  });
});
