import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();

  const [role, setRole] = useState("STUDENT");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStudent = role === "STUDENT";

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const payload = isStudent
      ? { registrationNumber: identifier, password, role }
      : { email: identifier, role: "TEACHER", password };

    try {
      const endpoint = isStudent ? "/auth/student-login" : "/auth/login";
      const res = await api.post(endpoint, payload);
      await login(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchRole = () => {
    setRole(isStudent ? "TEACHER" : "STUDENT");
    setIdentifier("");
    setPassword("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Dark decorative top panel */}
      <View style={styles.topPanel}>
        {/* Geometric accent circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.brandWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>C</Text>
          </View>
          <View>
            <Text style={styles.appName}>CampusIQ</Text>
            <Text style={styles.appTagline}>
              Academic Intelligence Platform
            </Text>
          </View>
        </View>

        {/* Role toggle chips */}
        <View style={styles.roleToggleWrap}>
          {["STUDENT", "TEACHER"].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                setRole(r);
                setIdentifier("");
                setPassword("");
              }}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === r && styles.roleChipTextActive,
                ]}
              >
                {r === "STUDENT" ? "Student" : "Teacher"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* White form panel */}
      <View style={styles.formPanel}>
        <Text style={styles.formTitle}>
          {isStudent ? "Welcome back" : "Teacher portal"}
        </Text>
        <Text style={styles.formSubtitle}>
          {isStudent
            ? "Sign in with your registration number"
            : "Sign in with your institutional email"}
        </Text>

        {/* Identifier */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>
            {isStudent ? "REGISTRATION NUMBER" : "EMAIL ADDRESS"}
          </Text>
          <TextInput
            style={styles.textInput}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={isStudent ? "e.g. 23CE001" : "teacher@college.edu"}
            placeholderTextColor="#C4C9D4"
            autoCapitalize={isStudent ? "characters" : "none"}
            keyboardType={isStudent ? "default" : "email-address"}
          />
        </View>

        {/* Password */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.textInput, { paddingRight: 50 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#C4C9D4"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Footer links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={switchRole} activeOpacity={0.7}>
            <Text style={styles.link}>
              Sign in as {isStudent ? "Teacher" : "Student"} →
            </Text>
          </TouchableOpacity>

          {isStudent && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
            >
              <Text style={styles.link}>New student? Register here →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },

  // ── Dark top panel ──
  topPanel: {
    flex: 0.42,
    backgroundColor: "#0A0A0F",
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 24,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.15)",
    top: -80,
    right: -60,
  },
  circle2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.08)",
    top: 40,
    right: 60,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoMarkText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appTagline: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 1,
    letterSpacing: 0.3,
  },

  // Role toggle
  roleToggleWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    alignSelf: "flex-start",
  },
  roleChip: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 9,
  },
  roleChipActive: {
    backgroundColor: "#4F46E5",
  },
  roleChipText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  roleChipTextActive: {
    color: "#FFFFFF",
  },

  // ── White form panel ──
  formPanel: {
    flex: 0.58,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F0F1A",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 28,
  },

  // Form fields
  fieldWrap: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginBottom: 7,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0F0F1A",
    backgroundColor: "#FAFAFA",
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  eyeText: {
    fontSize: 16,
  },

  // Login button
  loginBtn: {
    backgroundColor: "#0F0F1A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Footer
  footerLinks: {
    gap: 12,
    alignItems: "center",
  },
  link: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default LoginScreen;
