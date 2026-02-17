import { useIdentityAuth } from "@uipath/auth-react";
import { createContext, PropsWithChildren } from "react";

export const ShellUserContext = createContext<UserInfo | null>(null);

import { jwtDecode } from "jwt-decode";
import { z } from "zod";

const JwtPayloadSchema = z.object({
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
});

interface UserInfo {
  name: string;
  email: string;
}

export const decodeJWT = (token: string): UserInfo | null => {
  const { data: payload, success } = JwtPayloadSchema.safeParse(
    jwtDecode(token),
  );

  if (!success) {
    return null;
  }

  const firstName = payload.first_name;
  const lastName = payload.last_name;
  const displayName = `${firstName} ${lastName}`;

  return {
    name: displayName,
    email: payload.email,
  };
};

export const ShellUserProvider = ({ children }: PropsWithChildren) => {
  const { accessToken } = useIdentityAuth();
  const user = accessToken ? decodeJWT(accessToken) : null;

  return (
    <ShellUserContext.Provider value={user}>
      {children}
    </ShellUserContext.Provider>
  );
};
