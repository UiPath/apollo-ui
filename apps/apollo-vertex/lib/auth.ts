import { useQueryClient } from "@tanstack/react-query";
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

const STORAGE_KEYS = {
  TOKEN: "uipath_token",
  CODE_VERIFIER: "uipath_code_verifier",
  STATE: "uipath_state",
} as const;

const TokenDataSchema = z.object({
  access_token: z.string(),
  id_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  expiresAt: z.number(),
});

const getTokenEndpoint = (baseUrl: string) =>
  `${baseUrl}/identity_/connect/token`;
const getAuthorizationEndpoint = (baseUrl: string) =>
  `${baseUrl}/identity_/connect/authorize`;
const getRedirectUri = (baseUrl: string) =>
  typeof window === "undefined" ? "" : `${baseUrl}${window.location.pathname}`;

export type TokenData = z.infer<typeof TokenDataSchema>;

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

const isTokenExpired = (tokenData: TokenData): boolean => {
  return tokenData.expiresAt <= Date.now();
};

const shouldRefreshToken = (tokenData: TokenData): boolean => {
  const timeUntilExpiry = tokenData.expiresAt - Date.now();
  return timeUntilExpiry < REFRESH_THRESHOLD_MS;
};

const saveTokenData = (tokenData: TokenData): void => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(tokenData));
};

const clearTokenData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
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

  const data = await response.json();

  return TokenDataSchema.parse({
    access_token: data.access_token,
    id_token: data.id_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
};

const refreshAccessToken = async (
  refreshToken: string,
  clientId: string,
  baseUrl: string,
): Promise<TokenData> => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  return await fetchTokenData(baseUrl, body);
};

const refreshTokenIfNeeded = async (
  tokenData: TokenData,
  clientId: string,
  baseUrl: string,
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
    saveTokenData(newTokenData);
    return newTokenData.access_token;
  } catch {
    clearTokenData();
    return null;
  }
};

const exchangeCodeForToken = async (
  code: string,
  codeVerifier: string,
  clientId: string,
  baseUrl: string,
): Promise<TokenData> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(baseUrl),
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  return await fetchTokenData(baseUrl, body);
};

const handleOAuthCallback = async (
  clientId: string,
  baseUrl: string,
): Promise<void> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code || !state) {
    return;
  }

  const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
  if (state !== storedState) {
    throw new Error("State mismatch");
  }

  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  if (!codeVerifier) {
    throw new Error("Code verifier not found");
  }

  try {
    const tokenData = await exchangeCodeForToken(
      code,
      codeVerifier,
      clientId,
      baseUrl,
    );
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);
    saveTokenData(tokenData);
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (authError) {
    clearTokenData();
    toast.error(`Authentication failed: ${authError}`);
    throw authError;
  }
};

export const ensureValidToken = async (
  queryClient: ReturnType<typeof useQueryClient>,
  clientId: string,
  baseUrl: string,
): Promise<string | null> => {
  const params = new URLSearchParams(window.location.search);
  const isInOAuthCallback = params.has("code") && params.has("state");

  if (isInOAuthCallback) {
    try {
      await handleOAuthCallback(clientId, baseUrl);
      queryClient.invalidateQueries({ queryKey: TOKEN_QUERY_KEY });
    } catch {
      queryClient.setQueryData(TOKEN_QUERY_KEY, null);
    }
  }

  const tokenDataStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!tokenDataStr) {
    return null;
  }

  const parsed = JSON.parse(tokenDataStr);
  const { data: tokenData, success } = TokenDataSchema.safeParse(parsed);

  if (!success) {
    clearTokenData();
    return null;
  }

  if (isTokenExpired(tokenData) || shouldRefreshToken(tokenData)) {
    return refreshTokenIfNeeded(tokenData, clientId, baseUrl);
  }

  return tokenData.access_token;
};

export const login = async (
  clientId: string,
  scope: string,
  baseUrl: string,
): Promise<void> => {
  const pkce = await PKCEChallenge();
  const state = generateRandomString(32);

  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, pkce.code_verifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(baseUrl),
    response_type: "code",
    scope: scope,
    state,
    code_challenge: pkce.code_challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${getAuthorizationEndpoint(baseUrl)}?${params.toString()}`;
};

export const logout = (
  queryClient: ReturnType<typeof useQueryClient>,
): void => {
  clearTokenData();
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);
  queryClient.setQueryData(TOKEN_QUERY_KEY, null);
};
