import { z } from "zod";
import {
  type ResolvedAuthConfig,
  STORAGE_KEYS,
  type AuthConfiguration,
  resolveAuthConfig,
} from "./auth-config";

const TokenDataSchema = z.object({
  access_token: z.string(),
  id_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  expiresAt: z.number(),
});

export type TokenData = z.infer<typeof TokenDataSchema>;

const JwtPayloadSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  name: z.string().optional(),
  sub: z.string(),
});

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((x) => charset[x % charset.length])
    .join("");
}

async function generatePKCEChallenge(): Promise<{
  code_verifier: string;
  code_challenge: string;
}> {
  const code_verifier = generateRandomString(64);
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { code_verifier, code_challenge: base64 };
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

export function decodeJWT(token: string): {
  name: string;
  email: string;
  sub: string;
  first_name?: string;
  last_name?: string;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const { data, success } = JwtPayloadSchema.safeParse(payload);

    if (!success) return null;

    const firstName = data.first_name ?? "";
    const lastName = data.last_name ?? "";
    const displayName =
      data.name ?? ([firstName, lastName].filter(Boolean).join(" ") || "User");

    return {
      name: displayName,
      email: data.email,
      sub: data.sub,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
    };
  } catch {
    return null;
  }
}

const isTokenExpired = (tokenData: TokenData): boolean => {
  return tokenData.expiresAt <= Date.now();
};

const shouldRefreshToken = (tokenData: TokenData): boolean => {
  const timeUntilExpiry = tokenData.expiresAt - Date.now();
  return timeUntilExpiry < REFRESH_THRESHOLD_MS;
};

export const saveTokenData = (tokenData: TokenData): void => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(tokenData));
};

export const clearTokenData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

export const getStoredTokenData = (): TokenData | null => {
  const tokenDataStr = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!tokenDataStr) return null;

  try {
    const parsed = JSON.parse(tokenDataStr);
    const { data, success } = TokenDataSchema.safeParse(parsed);
    return success ? data : null;
  } catch {
    return null;
  }
};

const fetchTokenData = async (
  config: ResolvedAuthConfig,
  body: URLSearchParams
): Promise<TokenData> => {
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token request failed: ${errorText}`);
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
  config: ResolvedAuthConfig,
  refreshToken: string
): Promise<TokenData> => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  return await fetchTokenData(config, body);
};

const refreshTokenIfNeeded = async (
  config: ResolvedAuthConfig,
  tokenData: TokenData
): Promise<string | null> => {
  if (!tokenData.refresh_token) {
    return null;
  }

  try {
    const newTokenData = await refreshAccessToken(config, tokenData.refresh_token);
    saveTokenData(newTokenData);
    return newTokenData.access_token;
  } catch {
    clearTokenData();
    return null;
  }
};

const exchangeCodeForToken = async (
  config: ResolvedAuthConfig,
  code: string,
  codeVerifier: string
): Promise<TokenData> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });

  return await fetchTokenData(config, body);
};

export const handleOAuthCallback = async (
  config: ResolvedAuthConfig
): Promise<boolean> => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code || !state) {
    return false;
  }

  const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
  if (state !== storedState) {
    throw new Error("State mismatch");
  }

  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  if (!codeVerifier) {
    throw new Error("Code verifier not found");
  }

  const tokenData = await exchangeCodeForToken(config, code, codeVerifier);
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);
  saveTokenData(tokenData);
  window.history.replaceState({}, document.title, window.location.pathname);

  return true;
};

export const ensureValidToken = async (
  config: ResolvedAuthConfig
): Promise<string | null> => {
  const tokenData = getStoredTokenData();
  if (!tokenData) {
    return null;
  }

  if (isTokenExpired(tokenData) || shouldRefreshToken(tokenData)) {
    return refreshTokenIfNeeded(config, tokenData);
  }

  return tokenData.access_token;
};

export const login = async (config: AuthConfiguration): Promise<void> => {
  const resolvedConfig = resolveAuthConfig(config);
  const pkce = await generatePKCEChallenge();
  const state = generateRandomString(32);

  sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, pkce.code_verifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);

  const params = new URLSearchParams({
    client_id: resolvedConfig.clientId,
    redirect_uri: resolvedConfig.redirectUri,
    response_type: "code",
    scope: resolvedConfig.scope,
    state,
    code_challenge: pkce.code_challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${resolvedConfig.authorizationEndpoint}?${params.toString()}`;
};

export const logout = (config: AuthConfiguration): void => {
  clearTokenData();
  sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);

  const resolvedConfig = resolveAuthConfig(config);
  if (resolvedConfig.postLogoutRedirectUri) {
    window.location.href = resolvedConfig.postLogoutRedirectUri;
  }
};
