import {
  type AnchorHTMLAttributes,
  type ComponentType,
  createContext,
  type PropsWithChildren,
  useContext,
} from "react";

export type ShellLinkComponent = ComponentType<{
  to: string;
  href: string;
  className?: string;
  children?: React.ReactNode;
}>;

interface ShellLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

const DefaultLink = ({ to, ...props }: ShellLinkProps) => (
  <a href={to} {...props} />
);

interface ShellRouterContextValue {
  LinkComponent: ShellLinkComponent;
  pathname: string;
}

const ShellRouterContext = createContext<ShellRouterContextValue>({
  LinkComponent: DefaultLink,
  pathname: "/",
});

export const useShellPathname = () => useContext(ShellRouterContext).pathname;

export const ShellLink = ({ to, href, ...props }: ShellLinkProps) => {
  const { LinkComponent } = useContext(ShellRouterContext);
  return <LinkComponent to={to} href={href ?? to} {...props} />;
};

interface ShellRouterProviderProps {
  linkComponent: ShellLinkComponent;
  pathname: string;
}

export const ShellRouterProvider = ({
  linkComponent,
  pathname,
  children,
}: PropsWithChildren<ShellRouterProviderProps>) => (
  <ShellRouterContext value={{ LinkComponent: linkComponent, pathname }}>
    {children}
  </ShellRouterContext>
);
