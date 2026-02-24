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
      <ShellLayout
        companyName={companyName}
        productName={productName}
        companyLogo={companyLogo}
        variant={variant}
      >
        {children}
      </ShellLayout>
    </ShellUserProvider>
  );
};

interface ApolloShellProps extends ApolloShellComponentProps {
  clientId: string;
  scope: string;
  baseUrl: string;
  variant?: "minimal";
}

export const ApolloShell: FC<ApolloShellProps> = ({
  clientId,
  scope,
  baseUrl,
  children,
  companyName,
  productName,
  companyLogo,
  variant,
}) => {
  return (
    <ShellAuthProvider clientId={clientId} scope={scope} baseUrl={baseUrl}>
      <LocaleProvider>
        <ApolloShellComponent
          companyName={companyName}
          productName={productName}
          companyLogo={companyLogo}
          variant={variant}
        >
          {children}
        </ApolloShellComponent>
      </LocaleProvider>
    </ShellAuthProvider>
  );
};
