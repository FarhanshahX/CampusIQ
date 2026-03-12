import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const RegisterScreen = ({ navigation }) => {
  const { login } = useAuth();

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        registrationNumber,
        email,
        password,
        role: "STUDENT",
      });
      login(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: "700" }}>CampusIQ</Text>
      <Text style={{ color: "#6B7280", marginBottom: 24 }}>
        Student Registration
      </Text>

      <TextInput
        placeholder="Registration Number"
        style={input}
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
      />

      <TextInput
        placeholder="Email"
        style={input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={input}
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={button} onPress={handleRegister}>
        <Text style={{ color: "#fff" }}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={link}>Already have an account? Login</Text>
      </TouchableOpacity>
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

export default RegisterScreen;
