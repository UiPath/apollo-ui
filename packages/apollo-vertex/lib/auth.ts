import { useQueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import PKCEChallenge from "pkce-challenge";
import { toast } from "sonner";
import { z } from "zod";

export const TOKEN_QUERY_KEY = ["auth", "token"] as const;

function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((x) => charset[x % charset.length])
    .join("");
}

export const STORAGE_KEYS = {
  TOKEN: "uipath_token",
  CODE_VERIFIER: "uipath_code_verifier",
  STATE: "uipath_state",
  REQUESTED_SCOPE: "uipath_requested_scope",
  AUTH_RETURN_TO: "auth_return_to",
  LOGOUT_RETURN_TO: "logout_return_to",
} as const;

// The Coded App host serves the root shell for any path that is not an explicit
// file, so a hard navigation to a bare route path renders the docs home. Map it
// to its "/index.html" form on Coded App builds; no-op in dev.
export function toCodedAppFilePath(path: string): string {
  if (process.env.NEXT_PUBLIC_APOLLO_CODED_APP !== "1") return path;
  const trimmed = path.replace(/\/+$/, "");
  const lastSegment = trimmed.slice(trimmed.lastIndexOf("/") + 1);
  // Already an explicit file (e.g. ".../index.html"); leave it alone.
  if (lastSegment.includes(".")) return path;
  return `${trimmed}/index.html`;
}

// Same-origin absolute path only; rejects protocol-relative ("//") and
// backslash ("/\\") forms that window.location resolves off-origin.
function isSafeReturnPath(value: string): boolean {
  return (
    value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
  );
}

// Resolve a stored return path (from sessionStorage) into a safe navigation
// target: reject off-origin values, falling back to the app root (which honors
// the Coded App basePath, not the host root), then map to the "/index.html"
// file form for Coded App builds.
export function resolveReturnPath(stored: string | null): string {
  const codedAppPath = process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH;
  const fallback = codedAppPath ? `/${codedAppPath}` : "/";
  const path = stored && isSafeReturnPath(stored) ? stored : fallback;
  return toCodedAppFilePath(path);
}

const TokenResponseSchema = z.object({
  access_token: z.string(),
  id_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

const TokenDataSchema = TokenResponseSchema.extend({
  expiresAt: z.number(),
});

const getTokenEndpoint = (baseUrl: string) =>
  `${baseUrl}/identity_/connect/token`;
const getAuthorizationEndpoint = (baseUrl: string) =>
  `${baseUrl}/identity_/connect/authorize`;
const getRedirectUri = (redirectPath?: string) => {
  if (redirectPath) {
    return `${window.location.origin}${redirectPath}`;
  }
  return window.location.pathname === "/"
    ? window.location.origin
    : `${window.location.origin}${window.location.pathname}`;
};

export type TokenData = z.infer<typeof TokenDataSchema>;

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

const isTokenExpired = (tokenData: TokenData): boolean => {
  return tokenData.expiresAt <= Date.now();
};

const shouldRefreshToken = (tokenData: TokenData): boolean => {
  const timeUntilExpiry = tokenData.expiresAt - Date.now();
  return timeUntilExpiry < REFRESH_THRESHOLD_MS;
};

const normalizeScope = (scope: string): string =>
  [...new Set(scope.split(/\s+/).filter(Boolean))].toSorted().join(" ");

// Keyed by client so apps on one host (one localStorage) keep their own sessions,
// and by scope so a scope change forces a new login: a refresh can't add scopes.
const getTokenStorageKey = (clientId: string, scope: string): string =>
  `${STORAGE_KEYS.TOKEN}:${clientId}:${normalizeScope(scope)}`;

// Mirrors the storage key, so callers on another client or scope get their own
// cache entry.
export const getTokenQueryKey = (clientId: string, scope: string) =>
  [...TOKEN_QUERY_KEY, clientId, normalizeScope(scope)] as const;

const readTokenData = (storageKey: string): TokenData | null => {
  try {
    const { data, success } = TokenDataSchema.safeParse(
      JSON.parse(localStorage.getItem(storageKey) ?? "null"),
    );
    return success ? data : null;
  } catch {
    return null;
  }
};

export const getStoredIdToken = (
  clientId: string,
  scope: string,
): string | null =>
  readTokenData(getTokenStorageKey(clientId, scope))?.id_token ?? null;

const saveTokenData = (storageKey: string, tokenData: TokenData): void => {
  localStorage.setItem(storageKey, JSON.stringify(tokenData));
};

const clearTokenData = (storageKey: string): void => {
  localStorage.removeItem(storageKey);
};

const clearPendingLogin = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);
  sessionStorage.removeItem(STORAGE_KEYS.REQUESTED_SCOPE);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_RETURN_TO);
};

const fetchTokenData = async (baseUrl: string, body?: URLSearchParams) => {
  const response = await fetch(getTokenEndpoint(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const responseData = TokenResponseSchema.parse(await response.json());

  return TokenDataSchema.parse({
    ...responseData,
    expiresAt: Date.now() + responseData.expires_in * 1000,
  });
};

const refreshAccessToken = (
  refreshToken: string,
  clientId: string,
  baseUrl: string,
): Promise<TokenData> => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  return fetchTokenData(baseUrl, body);
};

const refreshTokenIfNeeded = async (
  tokenData: TokenData,
  clientId: string,
  baseUrl: string,
  storageKey: string,
): Promise<string | null> => {
  if (!tokenData.refresh_token) {
    return null;
  }

  try {
    const newTokenData = await refreshAccessToken(
      tokenData.refresh_token,
      clientId,
      baseUrl,
    );
    saveTokenData(storageKey, newTokenData);
    return newTokenData.access_token;
  } catch {
    clearTokenData(storageKey);
    return null;
  }
};

const exchangeCodeForToken = (
  code: string,
  codeVerifier: string,
  clientId: string,
  baseUrl: string,
  redirectPath?: string,
): Promise<TokenData> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(redirectPath),
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  return fetchTokenData(baseUrl, body);
};

const handleOAuthCallback = async (
  clientId: string,
  scope: string,
  baseUrl: string,
  redirectPath?: string,
): Promise<void> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (!state || (!code && !error)) {
    return;
  }

  const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  const requestedScope = sessionStorage.getItem(STORAGE_KEYS.REQUESTED_SCOPE);
  const returnTo =
    sessionStorage.getItem(STORAGE_KEYS.AUTH_RETURN_TO) ??
    window.location.pathname;
  clearPendingLogin();

  try {
    if (error !== null || code === null) {
      throw new Error(`OAuth error: ${error ?? "no code returned"}`);
    }
    if (state !== storedState) {
      throw new Error("State mismatch");
    }
    if (!codeVerifier) {
      throw new Error("Code verifier not found");
    }
    // False when the login began under another scope, e.g. from a bundle
    // deployed before this one; its token would lack the current scopes.
    const loginUsedCurrentScope =
      requestedScope !== null &&
      normalizeScope(requestedScope) === normalizeScope(scope);
    if (!loginUsedCurrentScope) {
      toast.info("Your sign-in settings changed. Please sign in again.");
      return;
    }
    const tokenData = await exchangeCodeForToken(
      code,
      codeVerifier,
      clientId,
      baseUrl,
      redirectPath,
    );
    saveTokenData(getTokenStorageKey(clientId, scope), tokenData);
  } catch (authError) {
    const message =
      authError instanceof Error ? authError.message : "Unknown error";
    toast.error(`Authentication failed: ${message}`);
  } finally {
    // Strips ?code and ?state on every outcome, or each refetch retries the
    // callback. It runs after the exchange, whose redirect_uri can be built
    // from the current path.
    window.history.replaceState({}, document.title, returnTo);
  }
};

export const ensureValidToken = async (
  clientId: string,
  scope: string,
  baseUrl: string,
  redirectPath?: string,
): Promise<string | null> => {
  await handleOAuthCallback(clientId, scope, baseUrl, redirectPath);

  const storageKey = getTokenStorageKey(clientId, scope);
  const tokenDataStr = localStorage.getItem(storageKey);
  if (!tokenDataStr) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(tokenDataStr);
  } catch {
    clearTokenData(storageKey);
    return null;
  }

  const { data: tokenData, success } = TokenDataSchema.safeParse(parsed);

  if (!success) {
    clearTokenData(storageKey);
    return null;
  }

  if (isTokenExpired(tokenData) || shouldRefreshToken(tokenData)) {
    return refreshTokenIfNeeded(tokenData, clientId, baseUrl, storageKey);
  }

  return tokenData.access_token;
};

export const login = async (
  clientId: string,
  scope: string,
  baseUrl: string,
  redirectPath?: string,
): Promise<void> => {
  const pkce = await PKCEChallenge();
  const state = generateRandomString(32);

  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, pkce.code_verifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);
  sessionStorage.setItem(STORAGE_KEYS.REQUESTED_SCOPE, scope);

  if (redirectPath && window.location.pathname !== redirectPath) {
    sessionStorage.setItem(
      STORAGE_KEYS.AUTH_RETURN_TO,
      window.location.pathname,
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(redirectPath),
    response_type: "code",
    scope: scope,
    state,
    code_challenge: pkce.code_challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${getAuthorizationEndpoint(baseUrl)}?${params.toString()}`;
};

// The unscoped pre-upgrade entry may belong to another app on the host; its id
// token's audience names the client. An unreadable entry is no one's session.
const isUnscopedSessionOf = (clientId: string): boolean => {
  const tokenData = readTokenData(STORAGE_KEYS.TOKEN);
  if (tokenData === null) {
    return true;
  }
  try {
    const { aud } = jwtDecode(tokenData.id_token);
    return Array.isArray(aud) ? aud.includes(clientId) : aud === clientId;
  } catch {
    return true;
  }
};

export const logout = (
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
): void => {
  // Signing out ends every session of this client, including ones from earlier
  // scopes and its pre-upgrade entry, which still hold refresh tokens.
  const clientPrefix = `${STORAGE_KEYS.TOKEN}:${clientId}:`;
  const sessionKeys = Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index),
  ).filter((key): key is string =>
    key === STORAGE_KEYS.TOKEN
      ? isUnscopedSessionOf(clientId)
      : key?.startsWith(clientPrefix) === true,
  );
  for (const key of sessionKeys) {
    clearTokenData(key);
  }
  clearPendingLogin();
  void queryClient.resetQueries({ queryKey: [...TOKEN_QUERY_KEY, clientId] });
};
