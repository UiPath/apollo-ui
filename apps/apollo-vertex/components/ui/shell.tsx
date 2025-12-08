import { AuthConfiguration, AuthGuard, SigninArgsWithState, UiPathAuthProvider, type User } from '@uipath/auth-react';
import type { FC, PropsWithChildren } from 'react';

export interface ApolloShellProps extends PropsWithChildren {
	configuration: AuthConfiguration;
	onSigninCallback: (user: void | User) => void;
	extraSigninRequestArgs?: SigninArgsWithState;
}

export const ApolloShell: FC<ApolloShellProps> = ({
	children,
	configuration,
	onSigninCallback,
	extraSigninRequestArgs,
}) => {
	return (
		<UiPathAuthProvider
			configuration={configuration}
			onSigninCallback={onSigninCallback}
		>
			<AuthGuard extraSigninRequestArgs={extraSigninRequestArgs}>
				{children}
			</AuthGuard>
		</UiPathAuthProvider>
	);
};

