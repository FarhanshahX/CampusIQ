import { createContext, useContext, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const login = async (email, role, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      role,
      password,
    });
    setUser(data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("userID", data._id);
    localStorage.setItem("firstTime", data.firstTime);

    return data.firstTime;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
