import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeZoneSelect } from './timezone-select';
import { getZoneGroups } from './timezones';

// Every zone the runtime knows, several hundred, so the list mounts its rows in batches of 60.
const allZones = () => getZoneGroups().flatMap((group) => group.zones);

// The viewer's zone decides which row the list opens on when it is the selected one, so the
// host's own zone is pinned rather than left to the machine (CI runs in UTC, the list's first
// row). Tokyo is neither that row nor any selected below.
let hostZone: string | undefined;
beforeEach(() => {
  hostZone = process.env.TZ;
  process.env.TZ = 'Asia/Tokyo';
});
afterEach(() => {
  if (hostZone === undefined) delete process.env.TZ;
  else process.env.TZ = hostZone;
});

const list = () => screen.getByRole('dialog', { name: 'Timezones' });
const activeRow = () =>
  within(list())
    .getAllByRole('option')
    .find((option) => option.getAttribute('aria-selected') === 'true');
const activeZone = () => activeRow()?.getAttribute('title');

async function openList(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button'));
  await user.click(screen.getByPlaceholderText('Search city, region or offset'));
}

describe('TimeZoneSelect keyboard browsing past the mounted rows', { timeout: 60_000 }, () => {
  // UTC is the list's first row, so the list opens with it active.
  it('loads the next batch when ArrowDown passes the last mounted row', async () => {
    const zones = allZones();
    expect(zones[0]).toBe('UTC');
    expect(zones.length).toBeGreaterThan(61);
    const user = userEvent.setup();
    render(<TimeZoneSelect value="UTC" onChange={vi.fn()} />);
    await openList(user);
    expect(activeZone()).toBe('UTC');
    // The viewer's own row is first, then the list's first batch.
    expect(screen.getAllByRole('option')).toHaveLength(61);

    // To row 60, the last mounted one, and one past it.
    await user.keyboard('{ArrowDown>59/}');
    expect(activeZone()).toBe(zones[59]);
    await user.keyboard('{ArrowDown}');
    expect(activeZone()).toBe(zones[60]);
    expect(screen.getAllByRole('option').length).toBeGreaterThan(61);
  });

  it('does not wrap to the top while rows remain unmounted', async () => {
    const zones = allZones();
    const user = userEvent.setup();
    render(<TimeZoneSelect value="UTC" onChange={vi.fn()} />);
    await openList(user);

    // One past the last mounted row; with looping it would wrap to the viewer's row at the top.
    await user.keyboard('{ArrowDown>60/}');
    const [viewerRow] = screen.getAllByRole('option');
    expect(viewerRow).toHaveAttribute('aria-selected', 'false');
    expect(activeZone()).toBe(zones[60]);
  });

  it('goes to the very last zone with End, mounting every row', async () => {
    const zones = allZones();
    const user = userEvent.setup();
    render(<TimeZoneSelect value="UTC" onChange={vi.fn()} />);
    await openList(user);

    await user.keyboard('{End}');
    expect(activeZone()).toBe(zones[zones.length - 1]);
    // The viewer's own row plus every zone.
    expect(screen.getAllByRole('option')).toHaveLength(zones.length + 1);
  });

  it('moves a page with PageDown and PageUp, across batches', async () => {
    const zones = allZones();
    const user = userEvent.setup();
    render(<TimeZoneSelect value="UTC" onChange={vi.fn()} />);
    await openList(user);

    // From row 0: 8, 16, ... 64 after eight pages.
    await user.keyboard('{PageDown>8/}');
    expect(activeZone()).toBe(zones[64]);
    await user.keyboard('{PageUp}');
    expect(activeZone()).toBe(zones[56]);
  });
});

describe(
  'TimeZoneSelect opening on a selected zone past the first batch',
  { timeout: 60_000 },
  () => {
    it('mounts and activates the selected row, and pages on from it', async () => {
      const zones = allZones();
      const selected = zones[100];
      const user = userEvent.setup();
      const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
      try {
        render(<TimeZoneSelect value={selected} onChange={vi.fn()} />);
        await openList(user);
        expect(activeZone()).toBe(selected);
        expect(scrolled.mock.contexts).toContain(activeRow());

        await user.keyboard('{PageDown}');
        expect(activeZone()).toBe(zones[108]);
        await user.keyboard('{ArrowDown}');
        expect(activeZone()).toBe(zones[109]);
      } finally {
        scrolled.mockRestore();
      }
    });

    it('starts from the selected row again after closing and reopening', async () => {
      const zones = allZones();
      const selected = zones[100];
      const user = userEvent.setup();
      render(<TimeZoneSelect value={selected} onChange={vi.fn()} />);

      // Browse away from it, then close without picking.
      await openList(user);
      await user.keyboard('{PageDown>5/}');
      expect(activeZone()).toBe(zones[140]);
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog', { name: 'Timezones' })).not.toBeInTheDocument();

      await openList(user);
      expect(activeZone()).toBe(selected);
      await user.keyboard('{PageDown}');
      expect(activeZone()).toBe(zones[108]);
      await user.keyboard('{ArrowDown}');
      expect(activeZone()).toBe(zones[109]);
    });

    it('starts from the selected row again after picking another zone and reopening', async () => {
      const zones = allZones();
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { rerender } = render(<TimeZoneSelect value={zones[100]} onChange={onChange} />);

      await openList(user);
      await user.keyboard('{PageDown}{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(zones[108]);
      rerender(<TimeZoneSelect value={zones[108]} onChange={onChange} />);

      await openList(user);
      expect(activeZone()).toBe(zones[108]);
      await user.keyboard('{ArrowDown}');
      expect(activeZone()).toBe(zones[109]);
    });
  }
);

describe('TimeZoneSelect opening on the viewer’s own zone', { timeout: 60_000 }, () => {
  it('opens on the "Your timezone" row when it is the selected zone', async () => {
    const zones = allZones();
    process.env.TZ = 'UTC';
    const user = userEvent.setup();
    render(<TimeZoneSelect value="UTC" onChange={vi.fn()} />);
    await openList(user);

    const [viewerRow, firstListed] = screen.getAllByRole('option');
    expect(viewerRow).toHaveAttribute('aria-selected', 'true');
    expect(firstListed).toHaveAttribute('aria-selected', 'false');
    await user.keyboard('{ArrowDown}');
    expect(firstListed).toHaveAttribute('aria-selected', 'true');
    expect(activeZone()).toBe(zones[0]);
  });
});
