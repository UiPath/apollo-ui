import type { FC, PropsWithChildren } from "react";
import { ShellAuthProvider, useAuth } from "./shell-auth-provider";
import { ShellLayout } from "./shell-layout";
import { LocaleProvider } from "./shell-locale-provider";
import { ShellLogin } from "./shell-login";
import { ShellUserProvider } from "./shell-user-provider";

export interface CompanyLogo {
  url: string;
  alt: string;
}

export interface ApolloShellComponentProps extends PropsWithChildren {
  companyName: string;
  productName: string;
  variant?: "minimal";
  companyLogo?: CompanyLogo;
}

const ApolloShellComponent: FC<ApolloShellComponentProps> = ({
  children,
  companyName,
  productName,
  companyLogo,
  variant,
}) => {
  const { accessToken } = useAuth();

  if (!accessToken) {
    return <ShellLogin />;
  }

  return (
    <ShellUserProvider>
      <LocaleProvider>
        <ShellLayout
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
          variant={variant}
        >
          {children}
        </ShellLayout>
      </LocaleProvider>
    </ShellUserProvider>
  );
};

interface ApolloShellProps extends ApolloShellComponentProps {
  tokenEndpoint: string;
  redirectUri: string;
  clientId: string;
  scope: string;
  authorizationEndpoint: string;
  variant?: "minimal";
}

export const ApolloShell: FC<ApolloShellProps> = ({
  tokenEndpoint,
  redirectUri,
  clientId,
  scope,
  authorizationEndpoint,
  children,
  companyName,
  productName,
  companyLogo,
  variant,
}) => {
  return (
    <ShellAuthProvider
      tokenEndpoint={tokenEndpoint}
      redirectUri={redirectUri}
      clientId={clientId}
      scope={scope}
      authorizationEndpoint={authorizationEndpoint}
    >
      <ApolloShellComponent
        children={children}
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
      />
    </ShellAuthProvider>
  );
};
