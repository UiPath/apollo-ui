import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureValidToken,
  getStoredIdToken,
  getTokenQueryKey,
  login,
  logout,
  STORAGE_KEYS,
  type TokenData,
} from "./auth";

const CLIENT_ID = "client-a";
const OTHER_CLIENT_ID = "client-b";
const BASE_URL = "https://example.test";
const SCOPE = "openid offline_access OR.Jobs DataFabric.Data.Read";
const NORMALIZED_SCOPE = "DataFabric.Data.Read OR.Jobs offline_access openid";
const TOKEN_STORAGE_KEY = `${STORAGE_KEYS.TOKEN}:${CLIENT_ID}:${NORMALIZED_SCOPE}`;

const tokenData = (overrides: Partial<TokenData> = {}): TokenData => ({
  access_token: "stored-access",
  id_token: "id",
  refresh_token: "refresh",
  expires_in: 3600,
  token_type: "Bearer",
  expiresAt: Date.now() + 60 * 60 * 1000,
  ...overrides,
});

const base64Url = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/=+$/, "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

const idTokenFor = (aud: string) =>
  `${base64Url({ alg: "none" })}.${base64Url({ aud })}.signature`;

const storeToken = (key: string, overrides: Partial<TokenData> = {}) => {
  localStorage.setItem(key, JSON.stringify(tokenData(overrides)));
};

const readToken = (key: string): unknown => {
  const raw = localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
};

const tokenResponse = (accessToken: string) =>
  new Response(
    JSON.stringify({
      access_token: accessToken,
      id_token: "id",
      refresh_token: "refresh-2",
      expires_in: 3600,
      token_type: "Bearer",
    }),
    { status: 200 },
  );

const mockTokenEndpoint = (accessToken: string) => {
  const fetchMock = vi.fn().mockResolvedValue(tokenResponse(accessToken));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const grantTypeOf = (init?: RequestInit) =>
  init?.body instanceof URLSearchParams ? init.body.get("grant_type") : null;

const mockFailingTokenEndpoint = () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response("invalid_grant", { status: 400 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const ensureValidTokenFor = (scope: string, clientId = CLIENT_ID) =>
  ensureValidToken(clientId, scope, BASE_URL, "/");

const loginAndReturnWithCode = async (scope: string) => {
  // jsdom reports the authorize redirect as an unimplemented navigation.
  vi.spyOn(console, "error").mockImplementation(() => null);
  await login(CLIENT_ID, scope, BASE_URL);
  const state = sessionStorage.getItem(STORAGE_KEYS.STATE);
  window.history.replaceState({}, "", `/?code=abc&state=${state}`);
};

const expectCallbackCleanedUp = () => {
  expect(window.location.search).toBe("");
  expect(sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)).toBeNull();
  expect(sessionStorage.getItem(STORAGE_KEYS.STATE)).toBeNull();
  expect(sessionStorage.getItem(STORAGE_KEYS.REQUESTED_SCOPE)).toBeNull();
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("token storage key", () => {
  it("finds the session whatever the scope order and spacing", async () => {
    storeToken(TOKEN_STORAGE_KEY);

    await expect(
      ensureValidTokenFor(
        "DataFabric.Data.Read  OR.Jobs openid offline_access",
      ),
    ).resolves.toBe("stored-access");
  });

  it("starts without a session when the scope changes, and does not refresh the old one", async () => {
    const fetchMock = mockTokenEndpoint("refreshed");
    storeToken(TOKEN_STORAGE_KEY, { expiresAt: Date.now() });

    await expect(
      ensureValidTokenFor(`${SCOPE} Traces.Api`),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps separate sessions for apps on different clients", async () => {
    storeToken(TOKEN_STORAGE_KEY, { access_token: "app-a" });
    storeToken(`${STORAGE_KEYS.TOKEN}:${OTHER_CLIENT_ID}:${NORMALIZED_SCOPE}`, {
      access_token: "app-b",
    });

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBe("app-a");
    await expect(ensureValidTokenFor(SCOPE, OTHER_CLIENT_ID)).resolves.toBe(
      "app-b",
    );
  });

  it("ignores a session stored under the unscoped key", async () => {
    storeToken(STORAGE_KEYS.TOKEN);

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
  });

  it("writes a refreshed token back under the same key", async () => {
    mockTokenEndpoint("refreshed");
    storeToken(TOKEN_STORAGE_KEY, { expiresAt: Date.now() });

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBe("refreshed");
    expect(readToken(TOKEN_STORAGE_KEY)).toMatchObject({
      access_token: "refreshed",
    });
  });

  it("clears the session when its refresh fails", async () => {
    mockFailingTokenEndpoint();
    storeToken(TOKEN_STORAGE_KEY, { expiresAt: Date.now() });

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
    expect(readToken(TOKEN_STORAGE_KEY)).toBeNull();
  });
});

describe("getTokenQueryKey", () => {
  it("normalizes the scope like the storage key", () => {
    expect(getTokenQueryKey(CLIENT_ID, "OR.Jobs  openid OR.Jobs")).toEqual([
      "auth",
      "token",
      CLIENT_ID,
      "OR.Jobs openid",
    ]);
  });
});

describe("login callback", () => {
  it("stores the exchanged token under the client and scope key", async () => {
    await loginAndReturnWithCode(SCOPE);
    mockTokenEndpoint("fresh");

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBe("fresh");
    expect(readToken(TOKEN_STORAGE_KEY)).toMatchObject({
      access_token: "fresh",
    });
    expectCallbackCleanedUp();
  });

  it("does not redeem the code when the login was started with another scope", async () => {
    await loginAndReturnWithCode("openid OR.Jobs");
    const fetchMock = mockTokenEndpoint("fresh");

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readToken(TOKEN_STORAGE_KEY)).toBeNull();
    expectCallbackCleanedUp();
  });

  it("does not redeem the code when the login recorded no scope", async () => {
    await loginAndReturnWithCode(SCOPE);
    sessionStorage.removeItem(STORAGE_KEYS.REQUESTED_SCOPE);
    const fetchMock = mockTokenEndpoint("fresh");

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expectCallbackCleanedUp();
  });

  it("cleans up when the state does not match", async () => {
    await loginAndReturnWithCode(SCOPE);
    window.history.replaceState({}, "", "/?code=abc&state=other");
    const fetchMock = mockTokenEndpoint("fresh");

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expectCallbackCleanedUp();
  });

  it("cleans up and redeems nothing when Identity returns an error", async () => {
    await loginAndReturnWithCode(SCOPE);
    const state = new URLSearchParams(window.location.search).get("state");
    window.history.replaceState({}, "", `/?error=access_denied&state=${state}`);
    const fetchMock = mockTokenEndpoint("fresh");

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expectCallbackCleanedUp();
  });

  it("cleans up when the exchange fails", async () => {
    await loginAndReturnWithCode(SCOPE);
    mockFailingTokenEndpoint();

    await expect(ensureValidTokenFor(SCOPE)).resolves.toBeNull();
    expectCallbackCleanedUp();
  });

  it("refreshes a stored session only once when the callback fails", async () => {
    storeToken(TOKEN_STORAGE_KEY, { expiresAt: Date.now() + 60 * 1000 });
    await loginAndReturnWithCode(SCOPE);
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        grantTypeOf(init) === "authorization_code"
          ? new Response("invalid_grant", { status: 400 })
          : tokenResponse("refreshed"),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient();

    // An observer makes the query active, like the shell's useQuery.
    const unsubscribe = new QueryObserver(queryClient, {
      queryKey: getTokenQueryKey(CLIENT_ID, SCOPE),
      queryFn: () => ensureValidToken(CLIENT_ID, SCOPE, BASE_URL, "/"),
    }).subscribe(() => null);
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0));
    unsubscribe();

    const refreshCalls = fetchMock.mock.calls.filter(
      ([, init]) => grantTypeOf(init) === "refresh_token",
    );
    expect(refreshCalls).toHaveLength(1);
    expect(readToken(TOKEN_STORAGE_KEY)).toMatchObject({
      access_token: "refreshed",
    });
  });
});

describe("getStoredIdToken", () => {
  it("reads the id token of this app's session, not the unscoped one", () => {
    storeToken(STORAGE_KEYS.TOKEN, { id_token: "legacy-id" });
    storeToken(TOKEN_STORAGE_KEY, { id_token: "app-id" });

    expect(getStoredIdToken(CLIENT_ID, SCOPE)).toBe("app-id");
  });

  it("returns null without a session", () => {
    expect(getStoredIdToken(CLIENT_ID, SCOPE)).toBeNull();
  });
});

describe("logout", () => {
  it("ends every session of this client and keeps other clients' sessions", () => {
    const earlierScopeKey = `${STORAGE_KEYS.TOKEN}:${CLIENT_ID}:OR.Jobs openid`;
    const otherClientKey = `${STORAGE_KEYS.TOKEN}:${OTHER_CLIENT_ID}:${NORMALIZED_SCOPE}`;
    storeToken(TOKEN_STORAGE_KEY);
    storeToken(earlierScopeKey);
    storeToken(STORAGE_KEYS.TOKEN, { id_token: idTokenFor(CLIENT_ID) });
    storeToken(otherClientKey);

    logout(new QueryClient(), CLIENT_ID);

    expect(readToken(TOKEN_STORAGE_KEY)).toBeNull();
    expect(readToken(earlierScopeKey)).toBeNull();
    expect(readToken(STORAGE_KEYS.TOKEN)).toBeNull();
    expect(readToken(otherClientKey)).not.toBeNull();
  });

  it("resets this client's cached tokens and keeps other clients'", () => {
    const queryClient = new QueryClient();
    const ownKeys = [
      getTokenQueryKey(CLIENT_ID, SCOPE),
      getTokenQueryKey(CLIENT_ID, "openid"),
    ];
    const otherClientKey = getTokenQueryKey(OTHER_CLIENT_ID, SCOPE);
    for (const key of [...ownKeys, otherClientKey]) {
      queryClient.setQueryData(key, "token");
    }

    logout(queryClient, CLIENT_ID);

    for (const key of ownKeys) {
      expect(queryClient.getQueryData(key)).toBeUndefined();
    }
    expect(queryClient.getQueryData(otherClientKey)).toBe("token");
  });

  it("keeps the unscoped entry when it belongs to another client", () => {
    storeToken(STORAGE_KEYS.TOKEN, { id_token: idTokenFor(OTHER_CLIENT_ID) });

    logout(new QueryClient(), CLIENT_ID);

    expect(readToken(STORAGE_KEYS.TOKEN)).not.toBeNull();
  });
});
