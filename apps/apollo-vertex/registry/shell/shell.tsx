import {
  type AuthConfiguration,
  AuthGuard,
  type SigninArgsWithState,
  UiPathAuthProvider,
  type User,
} from "@uipath/auth-react";
import type { FC, PropsWithChildren } from "react";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";

export interface CompanyLogo {
  url: string;
  alt: string;
}

export interface ApolloShellProps extends PropsWithChildren {
  configuration: AuthConfiguration;
  onSigninCallback: (user: void | User) => void;
  extraSigninRequestArgs?: SigninArgsWithState;
  companyName: string;
  productName: string;
  pathname: string;
  companyLogo?: CompanyLogo;
}

export const ApolloShell: FC<ApolloShellProps> = ({
  children,
  configuration,
  onSigninCallback,
  extraSigninRequestArgs,
  companyName,
  productName,
  pathname,
  companyLogo,
}) => {
  return (
    <UiPathAuthProvider
      configuration={configuration}
      onSigninCallback={onSigninCallback}
    >
      <AuthGuard extraSigninRequestArgs={extraSigninRequestArgs}>
        <LocaleProvider>
          <ShellLayout
            companyName={companyName}
            productName={productName}
            companyLogo={companyLogo}
            pathname={pathname}
          >
            {children}
          </ShellLayout>
        </LocaleProvider>
      </AuthGuard>
    </UiPathAuthProvider>
  );
};
