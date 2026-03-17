import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./shell-auth-provider";

export interface User {
  id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface UserContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserContext = createContext<UserContextValue | null>(null);

export const ShellUserProvider: FC<PropsWithChildren> = ({ children }) => {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (authUser) {
      // Map auth user to UserProvider's User interface
      const nameParts = authUser.name.split(" ");
      setUser({
        id: authUser.sub,
        name: authUser.name,
        email: authUser.email,
        first_name: nameParts[0] || authUser.name,
        last_name: nameParts.slice(1).join(" ") || "",
      });
    } else {
      setUser(null);
    }
  }, [authUser]);

  return (
    <UserContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
