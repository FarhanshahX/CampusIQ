import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();

  const [role, setRole] = useState("STUDENT");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const payload =
      role === "STUDENT"
        ? { registrationNumber: identifier, password, role }
        : { email: identifier, role: "TEACHER", password };

    if (role === "STUDENT") {
      try {
        const res = await api.post("/auth/student-login", payload);

        await login(res.data);
      } catch (err) {
        alert(err.response?.data?.message || "Login failed");
      }
    } else {
      try {
        const res = await api.post("/auth/login", payload);
        login(res.data);
      } catch (err) {
        alert(err.response?.data?.message || "Login failed");
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>CampusIQ</Text>
      <Text style={{ color: "#6B7280", marginBottom: 24 }}>
        {role === "STUDENT" ? "Student Login" : "Teacher Login"}
      </Text>

      <TextInput
        placeholder={
          role === "STUDENT" ? "Registration Number" : "Teacher Email"
        }
        style={input}
        value={identifier}
        onChangeText={setIdentifier}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={button} onPress={handleLogin}>
        <Text style={{ color: "#fff" }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setRole(role === "STUDENT" ? "TEACHER" : "STUDENT")}
      >
        <Text style={link}>
          Login as {role === "STUDENT" ? "Teacher" : "Student"}
        </Text>
      </TouchableOpacity>

      {role === "STUDENT" && (
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={link}>New Student? Register here</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const input = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
};

const button = {
  backgroundColor: "#111827",
  padding: 14,
  borderRadius: 8,
  alignItems: "center",
};

const link = {
  marginTop: 16,
  color: "#2563EB",
  textAlign: "center",
};

export default LoginScreen;
