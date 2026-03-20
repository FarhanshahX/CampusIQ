import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import axios from "axios";
import { API_BASE_URL } from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
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

        // Restore activeSubject from storage
        const storedActiveSubject = await AsyncStorage.getItem("activeSubject");
        if (storedActiveSubject) {
          setActiveSubject(JSON.parse(storedActiveSubject));
        } else if (parsed.role === "teacher" && parsed._id) {
          // No subject saved yet — auto-select the first one
          try {
            const res = await axios.get(
              `${API_BASE_URL}/api/subjects/teacher/${parsed._id}`,
              { headers: { Authorization: `Bearer ${storedToken}` } }
            );
            const subjects = res.data;
            if (subjects && subjects.length > 0) {
              const first = subjects[0];
              setActiveSubject(first);
              await AsyncStorage.setItem("activeSubject", JSON.stringify(first));
            }
          } catch (err) {
            console.log("Auto-select subject failed:", err.message);
          }
        }
      } else {
        // No stored session — still check for a stale activeSubject key and clear it
        const storedActiveSubject = await AsyncStorage.getItem("activeSubject");
        if (storedActiveSubject) {
          setActiveSubject(JSON.parse(storedActiveSubject));
        }
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

    const generateDeviceId = async () => {
      // Constants.installationId is deprecated/removed in newer Expo SDKs, fallback is needed
      const uniqueId = Constants.installationId || Device.osInternalBuildId || "unknown-device-id";
      const hashedDeviceId = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, String(uniqueId));
      return hashedDeviceId;
    };

    const userFromResponse =
      data.user ||
      (data.name || data.role
        ? { _id: data._id, name: data.name, role: normalizedRole }
        : null);

    if (userFromResponse && userFromResponse.role) {
      userFromResponse.role = String(userFromResponse.role).toLowerCase();
    }

    const deviceId = await generateDeviceId();
    const finalUser = { ...userFromResponse, deviceId };

    setUser(finalUser);
    setToken(data.token);
    // Use optional chaining for data.user to avoid "Cannot read properties of undefined" throws
    setDepartmentId(data?.user?.departmentID || data?.departmentID || null);

    await AsyncStorage.setItem("user", JSON.stringify(finalUser));
    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    setToken(null);
    setDepartmentId(null);
    setActiveSubject(null);
  };

  const changeActiveSubject = async (subject) => {
    setActiveSubject(subject);
    if (subject) {
      await AsyncStorage.setItem("activeSubject", JSON.stringify(subject));
    } else {
      await AsyncStorage.removeItem("activeSubject");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, activeSubject, changeActiveSubject, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
