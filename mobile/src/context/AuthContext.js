import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.role)
          parsed.role = String(parsed.role).toLowerCase();
        setUser(parsed);
        setToken(storedToken);
      }
      setLoading(false);
    };

    loadAuth();
  }, []);

  const login = async (data) => {
    // Normalize response for teacher and student logins and standardize role to lowercase
    const incomingRole = data?.user?.role || data?.role;
    const normalizedRole = incomingRole
      ? String(incomingRole).toLowerCase()
      : undefined;

    const userFromResponse =
      data.user ||
      (data.name || data.role
        ? { _id: data._id, name: data.name, role: normalizedRole }
        : null);

    if (userFromResponse && userFromResponse.role) {
      userFromResponse.role = String(userFromResponse.role).toLowerCase();
    }

    setUser(userFromResponse);
    setToken(data.token);
    setDepartmentId(data.user.departmentID || data.departmentID || null);

    if (userFromResponse) {
      await AsyncStorage.setItem("user", JSON.stringify(userFromResponse));
    }
    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    setToken(null);
    setDepartmentId(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
