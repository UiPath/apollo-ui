"use client";

import type { FC } from "react";
import { useAuth } from "./use-auth";

export interface AuthLoginProps {
  /**
   * The title to display on the login page
   */
  title?: string;
  /**
   * The description to display on the login page
   */
  description?: string;
  /**
   * The text to display on the login button
   */
  buttonText?: string;
}

export const AuthLogin: FC<AuthLoginProps> = ({
  title = "Welcome",
  description = "Sign in to access your dashboard",
  buttonText = "Sign in with UiPath",
}) => {
  const { login } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="space-y-6">
            <button
              type="button"
              onClick={() => login()}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-base shadow-sm hover:shadow-md"
            >
              {buttonText}
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
