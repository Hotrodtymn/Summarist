import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const isGuest =
    currentUser?.isAnonymous === true;

  const isAuthenticated =
    !!currentUser && !isGuest;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isGuest,
        isAuthenticated,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}