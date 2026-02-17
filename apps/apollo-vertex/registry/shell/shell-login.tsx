import { useAuth } from "./shell-auth-provider";

export const ShellLogin = () => {
  const { login } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => login()}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-base shadow-sm hover:shadow-md"
            >
              Sign in with UiPath
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Need help? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
};
