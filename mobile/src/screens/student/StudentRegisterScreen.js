import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import * as ImagePicker from "expo-image-picker";

// ─── Reusable form sub-components ────────────────────────────────────────────

const FieldLabel = ({ text, required }) => (
  <Text style={styles.fieldLabel}>
    {text.toUpperCase()}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

const FormInput = ({ label, required, secure, editable = true, ...props }) => (
  <View style={styles.fieldWrap}>
    <FieldLabel text={label} required={required} />
    <TextInput
      style={[styles.textInput, !editable && styles.textInputDisabled]}
      secureTextEntry={secure}
      placeholderTextColor="#C4C9D4"
      editable={editable}
      {...props}
    />
  </View>
);

const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionCardHeader}>
      <View style={styles.sectionIconWrap}>
        <Text style={styles.sectionIcon}>{icon}</Text>
      </View>
      <Text style={styles.sectionCardTitle}>{title}</Text>
    </View>
    <View style={styles.sectionCardBody}>{children}</View>
  </View>
);

const PickerField = ({ label, required, children }) => (
  <View style={styles.fieldWrap}>
    <FieldLabel text={label} required={required} />
    <View style={styles.pickerWrap}>{children}</View>
  </View>
);

const GenderSelector = ({ value, onChange }) => (
  <View style={styles.fieldWrap}>
    <FieldLabel text="Gender" required />
    <View style={styles.genderRow}>
      {["MALE", "FEMALE"].map((g) => (
        <TouchableOpacity
          key={g}
          onPress={() => onChange(g)}
          style={[
            styles.genderOption,
            value === g && styles.genderOptionActive,
          ]}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.genderRadio,
              value === g && styles.genderRadioActive,
            ]}
          >
            {value === g && <View style={styles.genderRadioDot} />}
          </View>
          <Text
            style={[
              styles.genderLabel,
              value === g && styles.genderLabelActive,
            ]}
          >
            {g === "MALE" ? "Male" : "Female"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const DateField = ({ value, onChange }) => {
  const [error, setError] = useState("");
  const handleChange = (text) => {
    onChange(text);
    if (text && !/^\d{4}-\d{2}-\d{2}$/.test(text))
      setError("Use format YYYY-MM-DD");
    else setError("");
  };
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text="Date of Birth" required />
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={handleChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#C4C9D4"
        maxLength={10}
        keyboardType="numeric"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const OtpRow = ({ value, onChange, onSendOtp, sending }) => (
  <View style={styles.fieldWrap}>
    <FieldLabel text="OTP Verification" required />
    <View style={styles.otpRow}>
      <TextInput
        style={[styles.textInput, { flex: 1 }]}
        value={value}
        onChangeText={onChange}
        placeholder="Enter OTP"
        placeholderTextColor="#C4C9D4"
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={[styles.otpBtn, sending && styles.otpBtnDisabled]}
        onPress={onSendOtp}
        disabled={sending}
        activeOpacity={0.85}
      >
        {sending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.otpBtnText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const PhotoUpload = ({ image, onPress }) => (
  <View style={styles.fieldWrap}>
    <FieldLabel text="Student Photo" />
    <TouchableOpacity
      style={[styles.photoUploadBox, image && styles.photoUploadBoxFilled]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {image ? (
        <>
          <Image source={{ uri: image.uri }} style={styles.photoPreview} />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoOverlayText}>Tap to change</Text>
          </View>
        </>
      ) : (
        <View style={styles.photoEmpty}>
          <View style={styles.photoEmptyIcon}>
            <Text style={{ fontSize: 28 }}>📷</Text>
          </View>
          <Text style={styles.photoEmptyTitle}>Upload your photo</Text>
          <Text style={styles.photoEmptySubtitle}>
            JPG or PNG · Passport size preferred
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const StudentRegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    registrationNumber: "",
    officialEmail: "",
    mobile: "",
    otp: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    college: "Smt. Indira Gandhi College of Engineering",
    departmentId: "",
    section: "",
    rollNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api
      .get("/student/departments")
      .then((res) => setDepartments(res.data || []))
      .catch((err) => console.error("Error fetching departments:", err));
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const getDeptShortName = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow media access to upload a photo.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setStudentPhoto(result.assets[0]);
    } catch (e) {
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const handleSendOtp = async () => {
    if (!form.officialEmail) {
      Alert.alert(
        "Email required",
        "Please enter your college email before sending an OTP.",
      );
      return;
    }
    setSendingOtp(true);
    try {
      await api.post("/student/initiate-registration", form);
      Alert.alert("OTP Sent", "Check your college email for the OTP.");
    } catch (err) {
      Alert.alert(
        "Failed",
        err.response?.data?.message || "Could not send OTP.",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      Alert.alert("Password mismatch", "Your passwords do not match.");
      return;
    }
    if (
      !form.registrationNumber ||
      !form.firstName ||
      !form.lastName ||
      !form.gender
    ) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (studentPhoto) {
      data.append("studentPhoto", {
        uri: studentPhoto.uri,
        name: "student.jpg",
        type: "image/jpeg",
      });
    }

    setSubmitting(true);
    try {
      await api.post("/student/create-student", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success 🎉", "Registration complete! You can now log in.", [
        { text: "Go to Login", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        err.response?.data?.message || "Please try again.",
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logoMarkSmall}>
            <Text style={styles.logoMarkSmallText}>C</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero text */}
        <View style={styles.heroWrap}>
          <Text style={styles.heroTitle}>Create account</Text>
          <Text style={styles.heroSubtitle}>
            Fill in your details to register as a student on CampusIQ
          </Text>
        </View>

        {/* ── Section 1: Identification ── */}
        <SectionCard title="Identification" icon="🪪">
          <FormInput
            label="Registration Number"
            required
            value={form.registrationNumber}
            onChangeText={(v) => set("registrationNumber", v)}
            placeholder="e.g. 23CE001"
            autoCapitalize="characters"
          />
        </SectionCard>

        {/* ── Section 2: Contact Details ── */}
        <SectionCard title="Contact Details" icon="📬">
          <FormInput
            label="College Email"
            required
            value={form.officialEmail}
            onChangeText={(v) => set("officialEmail", v)}
            placeholder="yourname@college.edu"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            label="Mobile Number"
            required
            value={form.mobile}
            onChangeText={(v) => set("mobile", v)}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
          />
        </SectionCard>

        {/* ── Section 3: Academic Info ── */}
        <SectionCard title="Academic Information" icon="🎓">
          <FormInput label="College" value={form.college} editable={false} />
          <PickerField label="Department & Semester" required>
            <Picker
              selectedValue={form.departmentId}
              onValueChange={(v) => set("departmentId", v)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select Department & Semester…"
                value=""
                color="#9CA3AF"
              />
              {departments.map((dept) => (
                <Picker.Item
                  key={dept._id}
                  label={`${getDeptShortName(dept.departmentName)}  ·  Semester ${dept.semester}`}
                  value={dept._id}
                  color="#111827"
                />
              ))}
            </Picker>
          </PickerField>
          <PickerField label="Section (Lab Batch)" required>
            <Picker
              selectedValue={form.section}
              onValueChange={(v) => set("section", v)}
              style={styles.picker}
            >
              <Picker.Item label="Select Section…" value="" color="#9CA3AF" />
              {["A", "B", "C", "D"].map((s) => (
                <Picker.Item
                  key={s}
                  label={`Section ${s}`}
                  value={s}
                  color="#111827"
                />
              ))}
            </Picker>
          </PickerField>
          <FormInput
            label="Roll Number"
            required
            value={form.rollNumber}
            onChangeText={(v) => set("rollNumber", v)}
            placeholder="e.g. 42"
            keyboardType="numeric"
          />
        </SectionCard>

        {/* ── Section 4: Personal Info ── */}
        <SectionCard title="Personal Information" icon="👤">
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="First Name"
                required
                value={form.firstName}
                onChangeText={(v) => set("firstName", v)}
                placeholder="Aditya"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Last Name"
                required
                value={form.lastName}
                onChangeText={(v) => set("lastName", v)}
                placeholder="Sharma"
              />
            </View>
          </View>
          <GenderSelector
            value={form.gender}
            onChange={(v) => set("gender", v)}
          />
          <DateField
            value={form.dateOfBirth}
            onChange={(v) => set("dateOfBirth", v)}
          />
        </SectionCard>

        {/* ── Section 5: Credentials ── */}
        <SectionCard title="Credentials & Verification" icon="🔐">
          <View style={styles.fieldWrap}>
            <FieldLabel text="Password" required />
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.textInput, { paddingRight: 50 }]}
                value={form.password}
                onChangeText={(v) => set("password", v)}
                secureTextEntry={!showPassword}
                placeholder="Create a password"
                placeholderTextColor="#C4C9D4"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 14 }}>
                  {showPassword ? "🙈" : "👁"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.fieldWrap}>
            <FieldLabel text="Confirm Password" required />
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.textInput, { paddingRight: 50 }]}
                value={form.confirmPassword}
                onChangeText={(v) => set("confirmPassword", v)}
                secureTextEntry={!showConfirm}
                placeholder="Repeat your password"
                placeholderTextColor="#C4C9D4"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Text style={{ fontSize: 14 }}>
                  {showConfirm ? "🙈" : "👁"}
                </Text>
              </TouchableOpacity>
            </View>
            {form.confirmPassword !== "" &&
              form.password !== form.confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
          </View>
          <OtpRow
            value={form.otp}
            onChange={(v) => set("otp", v)}
            onSendOtp={handleSendOtp}
            sending={sendingOtp}
          />
        </SectionCard>

        {/* ── Section 6: Documents ── */}
        <SectionCard title="Documents" icon="📎">
          <PhotoUpload image={studentPhoto} onPress={pickImage} />
        </SectionCard>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.7}
          style={{ marginTop: 16, marginBottom: 32 }}
        >
          <Text style={styles.loginLink}>
            Already have an account? Sign in →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FA" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0A0A0F",
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  headerCenter: { alignItems: "center" },
  logoMarkSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoMarkSmallText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Hero
  heroWrap: { marginBottom: 24, marginTop: 4 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F0F1A",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 13, color: "#9CA3AF", lineHeight: 19 },

  // Section Card
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionIcon: { fontSize: 16 },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.1,
  },
  sectionCardBody: { padding: 18 },

  // Field
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginBottom: 7,
  },
  required: { color: "#EF4444" },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  textInputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  errorText: { fontSize: 11, color: "#EF4444", marginTop: 4 },

  // Picker
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  picker: { height: 50, color: "#111827" },

  // Name row (side by side)
  nameRow: { flexDirection: "row", gap: 12 },

  // Gender
  genderRow: { flexDirection: "row", gap: 12 },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
  },
  genderOptionActive: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  genderRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  genderRadioActive: { borderColor: "#4F46E5" },
  genderRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },
  genderLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  genderLabelActive: { color: "#4F46E5" },

  // Password
  passwordWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  // OTP row
  otpRow: { flexDirection: "row", gap: 10 },
  otpBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 96,
  },
  otpBtnDisabled: { opacity: 0.6 },
  otpBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Photo upload
  photoUploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    height: 160,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  photoUploadBoxFilled: {
    borderStyle: "solid",
    borderColor: "#4F46E5",
  },
  photoPreview: { width: "100%", height: "100%" },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    alignItems: "center",
  },
  photoOverlayText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  photoEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  photoEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  photoEmptyTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  photoEmptySubtitle: { fontSize: 11, color: "#9CA3AF" },

  // Submit
  submitBtn: {
    backgroundColor: "#0A0A0F",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  loginLink: {
    color: "#4F46E5",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default StudentRegisterScreen;
