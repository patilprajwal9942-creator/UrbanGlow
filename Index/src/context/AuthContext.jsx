import {
  createContext,
  useEffect,
  useState,
} from "react";

import {
  authAPI,
  adminAuthAPI,
} from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    async function loadUser() {
      try {
        const savedUser = localStorage.getItem("user");

        // No saved user
        if (!savedUser) {
          setUser(null);
          return;
        }

        let parsedUser;

        try {
          parsedUser = JSON.parse(savedUser);
        } catch (error) {
          console.error(
            "Invalid user data in localStorage:",
            error
          );

          localStorage.removeItem("user");
          setUser(null);
          return;
        }

        if (!parsedUser?.role) {
          localStorage.removeItem("user");
          setUser(null);
          return;
        }

        // ==========================================
        // ADMIN
        // ==========================================

        if (parsedUser.role === "admin") {
          const response = await adminAuthAPI.getMe();

          if (response.data?.success && response.data?.user) {
            const currentUser = response.data.user;

            setUser(currentUser);

            localStorage.setItem(
              "user",
              JSON.stringify(currentUser)
            );
          } else {
            setUser(null);
            localStorage.removeItem("user");
          }

          return;
        }

        // ==========================================
        // CUSTOMER / SALON OWNER
        // ==========================================

        const response = await authAPI.getMe();

        if (response.data?.success && response.data?.user) {
          const currentUser = response.data.user;

          setUser(currentUser);

          localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
          );
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error(
          "Load user error:",
          error
        );

        setUser(null);

        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  function login(userData) {
    if (!userData) {
      console.error("Login failed: user data is missing");
      return;
    }

    setUser(userData);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function logout() {
    try {
      if (user?.role === "admin") {
        await adminAuthAPI.logout();
      } else {
        await authAPI.logout();
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      setUser(null);

      localStorage.removeItem("user");
    }
  }

  // ==========================================
  // CONTEXT
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}