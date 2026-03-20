import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const [activeSubject, setActiveSubject] = useState(
    JSON.parse(localStorage.getItem("activeSubject")) || null
  );

  const login = async (email, role, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      role,
      password,
    });
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("token", data.token);
    localStorage.setItem("userID", data._id);
    localStorage.setItem("firstTime", data.firstTime);

    // If teacher, fetch and set active subject
    if (role === "TEACHER") {
      try {
        const subjectsRes = await api.get(`/subjects/teacher/${data._id}`);
        if (subjectsRes.data && subjectsRes.data.length > 0) {
          const defaultSubject = subjectsRes.data[0];
          setActiveSubject(defaultSubject);
          localStorage.setItem("activeSubject", JSON.stringify(defaultSubject));
        }
      } catch (err) {
        console.error("Error fetching default subject", err);
      }
    }

    return data.firstTime;
  };

  const changeActiveSubject = (subject) => {
    setActiveSubject(subject);
    localStorage.setItem("activeSubject", JSON.stringify(subject));
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setActiveSubject(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, activeSubject, changeActiveSubject }}>
      {children}
    </AuthContext.Provider>
  );
};
