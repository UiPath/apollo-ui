import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRequestContext } from './usePlatformAccess';
import { buildLlmConfigurationsUrl, useCanManageByo, useUserFolders } from './usePlatformAccess';

const CTX: PlatformRequestContext = {
  token: 'test-token',
  // Trailing slash on purpose — the hooks must strip it before joining.
  baseUrl: 'https://cloud.local/acme/',
  tenantName: 'DefaultTenant',
  tenantId: 'tenant-guid',
  requestingProduct: 'agents',
  requestingFeature: 'design-eval-deploy',
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
          <li key={f.id}>{`${f.id}|${f.label}|${f.numericId}`}</li>
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

    expect(await screen.findByText('guid-a|Shared|1')).toBeInTheDocument();
    expect(screen.getByText('guid-b|Finance|2')).toBeInTheDocument();
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
  it('grants management for organization admins', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ accountRoleType: 'ACCOUNT_ADMIN' }));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('true'));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cloud.local/acme/portal_/api/organization/UserOrganizationInfo',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('grants management for organization owners', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ accountRoleType: 'ACCOUNT_OWNER' }));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('true'));
  });

  it.each([
    'DEFAULT_USER',
    'TENANT_ADMIN',
  ])('denies management for role %s (org admin only)', async (accountRoleType) => {
    fetchMock.mockResolvedValue(jsonResponse({ accountRoleType }));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('false'));
  });

  it('denies management when the response carries no role', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    render(<ByoProbe ctx={CTX} />);

    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('false'));
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

  it('resets the verdict while re-checking a new context (fail closed on refetch)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ accountRoleType: 'ACCOUNT_ADMIN' }));
    const { rerender } = render(<ByoProbe ctx={CTX} />);
    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('true'));

    // Second context: keep the request pending and assert the previous
    // `true` verdict does not survive into the new check.
    fetchMock.mockReturnValue(new Promise(() => {}));
    rerender(<ByoProbe ctx={{ ...CTX, token: 'other-token' }} />);
    await waitFor(() => expect(screen.getByTestId('can-manage')).toHaveTextContent('undefined'));
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });
});

describe('buildLlmConfigurationsUrl', () => {
  const ROOT = 'https://cloud.local/acme/portal_/admin/ai-trust-layer/llm-configurations';

  it('deep-links to the add page with product/feature pre-population params', () => {
    expect(buildLlmConfigurationsUrl(CTX, { intent: 'add', folderNumericId: 2241521 })).toBe(
      `${ROOT}/tenant-guid/2241521/add?product=agents&feature=design-eval-deploy`
    );
  });

  it('omits the pre-population query when product/feature are unknown', () => {
    const ctx = { ...CTX, requestingProduct: undefined, requestingFeature: undefined };
    expect(buildLlmConfigurationsUrl(ctx, { intent: 'add', folderNumericId: 7 })).toBe(
      `${ROOT}/tenant-guid/7/add`
    );
  });

  it('deep-links to the edit page when a configuration id is known', () => {
    expect(
      buildLlmConfigurationsUrl(CTX, {
        intent: 'edit',
        folderNumericId: 7,
        configurationId: 'config-guid',
      })
    ).toBe(`${ROOT}/tenant-guid/7/edit/config-guid`);
  });

  it('falls back to the list for edit intent without a configuration id', () => {
    expect(buildLlmConfigurationsUrl(CTX, { intent: 'edit', folderNumericId: 7 })).toBe(
      `${ROOT}?tenantId=tenant-guid&folderId=7`
    );
  });

  it('falls back to the configurations list without a folder, carrying the tenant', () => {
    expect(buildLlmConfigurationsUrl(CTX, { intent: 'add' })).toBe(`${ROOT}?tenantId=tenant-guid`);
  });

  it('falls back to the bare list without tenant or folder', () => {
    const ctx: PlatformRequestContext = { token: 't', tenantName: 'DefaultTenant' };
    expect(buildLlmConfigurationsUrl(ctx, { intent: 'add' })).toBe(
      '/portal_/admin/ai-trust-layer/llm-configurations'
    );
  });
});
