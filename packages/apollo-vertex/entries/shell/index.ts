"use client";

export {
  ApolloShell,
  type ApolloShellProps,
  type CompanyLogo,
  type ShellNavItem,
  type ShellSubNavItem,
} from "@/registry/shell/shell";
export {
  AuthContext,
  ShellAuthProvider,
  useAuth,
  type AuthContextValue,
  type UserInfo,
} from "@/registry/shell/shell-auth-provider";
export { LocaleProvider } from "@/registry/shell/shell-locale-provider";
export { ThemeProvider } from "@/registry/shell/shell-theme-provider";
export {
  MembershipDenied,
  VerifyingMembership,
  type MembershipDeniedProps,
} from "@/registry/shell/group-membership-screens";
export { Role } from "@/registry/shell/shell-roles";
export { useAccessToken } from "@/registry/shell/shell-auth-provider";
export { useTheme } from "@/registry/shell/shell-theme-provider";
export { ShellLogin } from "@/registry/shell/shell-login";
export { ShellLayout } from "@/registry/shell/shell-layout";
export { ShellSidebar } from "@/registry/shell/shell-sidebar";
export { ShellUserProvider } from "@/registry/shell/shell-user-provider";
export {
  SUPPORTED_LOCALES,
  configurei18n,
  type SupportedLocale,
} from "@/lib/i18n";
export {
  STORAGE_KEYS,
  TOKEN_QUERY_KEY,
  ensureValidToken,
  login,
  logout,
  resolveReturnPath,
  toCodedAppFilePath,
} from "@/lib/auth";
