import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRequestContext } from './usePlatformAccess';
import { useCanManageByo, useUserFolders } from './usePlatformAccess';

const CTX: PlatformRequestContext = {
  token: 'test-token',
  // Trailing slash on purpose — the hooks must strip it before joining.
  baseUrl: 'https://cloud.local/acme/',
  tenantName: 'DefaultTenant',
  organizationId: 'org-guid',
  userId: 'user-guid',
};

const FOLDERS_URL =
  'https://cloud.local/acme/DefaultTenant/orchestrator_/api/' +
  'FoldersNavigation/GetFoldersForCurrentUser?take=100';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Server Error',
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const FoldersProbe: React.FC<{ ctx: PlatformRequestContext | null }> = ({ ctx }) => {
  const { folders, loading, error, refetch } = useUserFolders(ctx);
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error?.message ?? 'none'}</span>
      <button type="button" aria-label="refetch" onClick={refetch} />
      <ul>
        {folders.map((f) => (
          <li key={f.id}>{`${f.id}|${f.label}`}</li>
        ))}
      </ul>
    </div>
  );
};

const ByoProbe: React.FC<{ ctx: PlatformRequestContext | null }> = ({ ctx }) => {
  const { canManage, loading, error } = useCanManageByo(ctx);
  return (
    <div>
      <span data-testid="can-manage">{String(canManage)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error?.message ?? 'none'}</span>
    </div>
  );
};

describe('useUserFolders', () => {
  it('calls FoldersNavigation with the bearer token and maps PageItems', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        Count: 2,
        PageItems: [
          { Id: 1, Key: 'guid-a', DisplayName: 'Shared' },
          { Id: 2, Key: 'guid-b', DisplayName: 'Finance' },
        ],
      })
    );
    render(<FoldersProbe ctx={CTX} />);

    expect(await screen.findByText('guid-a|Shared')).toBeInTheDocument();
    expect(screen.getByText('guid-b|Finance')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(fetchMock).toHaveBeenCalledWith(
      FOLDERS_URL,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('surfaces HTTP errors and keeps the folder list empty', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 403));
    render(<FoldersProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('403'));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('does not fetch when disabled (null context)', () => {
    render(<FoldersProbe ctx={null} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('refetch fires the request again', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse({ Count: 0, PageItems: [] }));
    render(<FoldersProbe ctx={CTX} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'refetch' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});

describe('useCanManageByo', () => {
  it('grants management when the entitlement is held', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ isEntitled: { AiTrustLayerByoLlm: true } }));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('true'));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cloud.local/acme/lease_/api/entitlements/org-guid/entitled?userId=user-guid',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ EntitlementNames: ['AiTrustLayerByoLlm'] }),
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('denies management when the entitlement is absent from the response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ isEntitled: {} }));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('false'));
  });

  it('omits the userId query when the context has no user', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ isEntitled: { AiTrustLayerByoLlm: true } }));
    const noUserCtx: PlatformRequestContext = {
      token: CTX.token,
      baseUrl: CTX.baseUrl,
      tenantName: CTX.tenantName,
      organizationId: CTX.organizationId,
    };
    render(<ByoProbe ctx={noUserCtx} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('true'));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cloud.local/acme/lease_/api/entitlements/org-guid/entitled',
      expect.anything()
    );
  });

  it('fails closed on HTTP errors', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('false'));
    expect(screen.getByTestId('error')).toHaveTextContent('500');
  });

  it('fails closed on network errors', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('false'));
    expect(screen.getByTestId('error')).toHaveTextContent('network down');
  });

  it('resolves to undefined (no affordances) when disabled', () => {
    render(<ByoProbe ctx={null} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('can-manage')).toHaveTextContent('undefined');
  });
});
