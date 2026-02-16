export interface AuthConfiguration {
  /**
   * The base URL of the identity provider (e.g., "https://staging.uipath.com")
   */
  authority: string;
  /**
   * The OAuth client ID
   */
  clientId: string;
  /**
   * The URL to redirect to after authentication
   */
  redirectUri: string;
  /**
   * The URL to redirect to after logout
   */
  postLogoutRedirectUri?: string;
  /**
   * OAuth scopes to request
   */
  scope: string;
}

export interface ResolvedAuthConfig {
  baseUrl: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scope: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
}

export const STORAGE_KEYS = {
  TOKEN: "uipath_token",
  CODE_VERIFIER: "uipath_code_verifier",
  STATE: "uipath_state",
} as const;

export const resolveAuthConfig = (
  config: AuthConfiguration
): ResolvedAuthConfig => {
  const baseUrl = config.authority.replace(/\/identity_\/?$/, "");
  const idpRoute = "identity_";

  return {
    baseUrl,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    postLogoutRedirectUri:
      config.postLogoutRedirectUri ?? window.location.origin,
    scope: config.scope,
    authorizationEndpoint: `${baseUrl}/${idpRoute}/connect/authorize`,
    tokenEndpoint: `${baseUrl}/${idpRoute}/connect/token`,
  };
};
