import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const ProfileScreen = () => {
  const { user, login, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCgpa, setIsEditingCgpa] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [cgpa, setCgpa] = useState(Array(8).fill(""));

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/students/${user._id}`);
      const s = res.data;

      setStudent(s);
      setFirstName(s.firstName || "");
      setLastName(s.lastName || "");
      setEmail(s.email || "");
      setMobile(s.mobile || "");
      setRegistrationNumber(s.registrationNumber || "");
      setPhotoUrl(s.studentPhoto || "");
      setCgpa(
        s.cgpa && s.cgpa.length > 0
          ? s.cgpa.map((val) => (val ? String(val) : ""))
          : Array(8).fill(""),
      );
    } catch (error) {
      console.error("Error fetching profile", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotoUrl(base64Img);
    }
  };

  const handleCgpaChange = (text, index) => {
    const newCgpa = [...cgpa];
    newCgpa[index] = text;
    setCgpa(newCgpa);
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);

      const updateData = {
        firstName,
        lastName,
        mobile,
        photoUrl,
        userId: user._id,
      };

      const res = await api.put(`/student/profile`, updateData);

      // Update global user state with new info
      login({ ...user, ...res.data, token: user.token });

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCgpa = async () => {
    try {
      setSaving(true);
      const updateData = {
        cgpa: cgpa.map((val) => (val ? parseFloat(val) : 0)),
        userId: user._id,
      };

      const res = await api.put(`/student/profile`, updateData);

      // Update local state
      setStudent({ ...student, cgpa: updateData.cgpa });

      Alert.alert("Success", "CGPA updated successfully!");
      setIsEditingCgpa(false);
    } catch (error) {
      console.error("Error updating CGPA", error);
      Alert.alert("Error", "Failed to update CGPA");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/student/profile`, {
        password: newPassword,
        userId: user._id,
      });

      Alert.alert("Success", "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error) {
      console.error("Error updating password", error);
      Alert.alert("Error", "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B5BDB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Area */}
      <View style={styles.headerArea}>
        <View style={styles.photoWrapper}>
          <TouchableOpacity
            onPress={isEditing ? pickImage : null}
            activeOpacity={isEditing ? 0.7 : 1}
            style={styles.photoContainer}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color="#9CA3AF" />
              </View>
            )}
            {isEditing && (
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!isEditing && (
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.headerSubtitle}>{registrationNumber}</Text>
          </View>
        )}
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <Text style={styles.sectionTitleDetails}>Personal Details</Text>
        <TouchableOpacity
          style={isEditing ? styles.cancelBtn : styles.editBtn}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons
            name={isEditing ? "close-circle" : "create-outline"}
            size={18}
            color={isEditing ? "#EF4444" : "#3B5BDB"}
          />
          <Text style={[styles.editBtnText, isEditing && { color: "#EF4444" }]}>
            {isEditing ? "Cancel" : "Edit Profile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Details Card */}
      <View style={styles.card}>
        {isEditing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                placeholder="Enter mobile number"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address (Read-only)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#F3F4F6", color: "#6B7280" },
                ]}
                value={email}
                editable={false}
              />
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>
                  {firstName} {lastName}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                <Text style={styles.infoValue}>{mobile || "Not provided"}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Registration Number</Text>
                <Text style={styles.infoValue}>{registrationNumber}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* CGPA Section */}
      <View style={styles.card}>
        <View style={styles.actionBar}>
          <Text style={styles.sectionTitleDetails}>
            Academic Status {"\n"}(CGPA)
          </Text>
          <TouchableOpacity
            style={isEditingCgpa ? styles.cancelBtn : styles.editBtn}
            onPress={() => setIsEditingCgpa(!isEditingCgpa)}
          >
            <Ionicons
              name={isEditingCgpa ? "close-circle" : "create-outline"}
              size={18}
              color={isEditingCgpa ? "#EF4444" : "#3B5BDB"}
            />
            <Text
              style={[
                styles.editBtnText,
                isEditingCgpa && { color: "#EF4444" },
              ]}
            >
              {isEditingCgpa ? "Cancel" : "Update CGPA"}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditingCgpa ? (
          <View style={styles.cgpaEditContainer}>
            <Text style={styles.helperText}>
              Enter your CGPA for each semester.
            </Text>
            <View style={styles.cgpaGrid}>
              {cgpa.map((val, index) => (
                <View key={index} style={styles.cgpaItem}>
                  <Text style={styles.label}>Sem {index + 1}</Text>
                  <TextInput
                    style={styles.input}
                    value={val}
                    onChangeText={(text) => handleCgpaChange(text, index)}
                    keyboardType="numeric"
                    placeholder="0.0"
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#10B981" }]}
              onPress={handleUpdateCgpa}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save CGPA</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cgpaViewGrid}>
            {cgpa.map((val, index) => (
              <View key={index} style={styles.cgpaViewItem}>
                <Text style={styles.cgpaSemText}>SEM {index + 1}</Text>
                <Text style={styles.cgpaValText}>{val || "0.00"}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Password Management */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.passwordHeader}
          onPress={() => setShowPasswordSection(!showPasswordSection)}
        >
          <View style={styles.flexRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#111827"
            />
            <Text
              style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 10 }]}
            >
              Security & Password
            </Text>
          </View>
          <Ionicons
            name={showPasswordSection ? "chevron-up" : "chevron-down"}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>

        {showPasswordSection && (
          <View style={styles.passwordContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: "#111827", marginTop: 8 },
              ]}
              onPress={handleUpdatePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#DC2626"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  photoWrapper: {
    marginRight: 20,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#3B5BDB",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleDetails: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B5BDB",
    marginLeft: 6,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  infoList: {
    gap: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  saveBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  cgpaEditContainer: {
    marginTop: 10,
  },
  cgpaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cgpaItem: {
    width: "48%",
    marginBottom: 16,
  },
  cgpaViewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cgpaViewItem: {
    width: "23%",
    backgroundColor: "#F9FAFB",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cgpaSemText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  cgpaValText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3B5BDB",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  helperText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 10,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default ProfileScreen;
