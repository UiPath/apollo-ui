import {
  type AuthConfiguration,
  AuthGuard,
  type SigninArgsWithState,
  UiPathAuthProvider,
  type User,
} from "@uipath/auth-react";
import type { FC, PropsWithChildren } from "react";
import { ShellLayout } from "./internal/shell-layout";

export interface ApolloShellProps extends PropsWithChildren {
  configuration: AuthConfiguration;
  onSigninCallback: (user: void | User) => void;
  extraSigninRequestArgs?: SigninArgsWithState;
  companyName: string;
  productName: string;
  companyLogo: React.ReactElement;
}

export const ApolloShell: FC<ApolloShellProps> = ({
  children,
  configuration,
  onSigninCallback,
  extraSigninRequestArgs,
  companyName,
  productName,
  companyLogo,
}) => {
  return (
    <UiPathAuthProvider
      configuration={configuration}
      onSigninCallback={onSigninCallback}
    >
      <AuthGuard extraSigninRequestArgs={extraSigninRequestArgs}>
        <ShellLayout
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
        >
          {children}
        </ShellLayout>
      </AuthGuard>
    </UiPathAuthProvider>
  );
};
