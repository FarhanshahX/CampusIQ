import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Button,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState, useEffect } from "react";
import api from "../../api/axios";
import * as ImagePicker from "expo-image-picker";

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
  // const [idCardPhoto, setIdCardPhoto] = useState(null);

  // department list fetched from server
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/student/departments");
        setDepartments(res.data || []);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, []);

  const pickImage = async (setImage) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow media access to upload images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      setImage(result.assets[0]);
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Could not open image picker");
    }
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendOtp = async () => {
    try {
      const res = await api.post("/student/initiate-registration", form);
      alert("OTP sent successfully");
    } catch (err) {
      console.error("Error sending OTP:", err);
    }
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    if (studentPhoto) {
      data.append("studentPhoto", {
        uri: studentPhoto.uri,
        name: "student.jpg",
        type: "image/jpeg",
      });
    }

    // if (idCardPhoto) {
    //   data.append("idCardPhoto", {
    //     uri: idCardPhoto.uri,
    //     name: "idcard.jpg",
    //     type: "image/jpeg",
    //   });
    // }

    try {
      await api.post("/student/create-student", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Student registered successfully");
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    }

    // await api.post("/student/create-student", data, {
    //   headers: {
    //     "Content-Type": "multipart/form-data",
    //   },
    // });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={title}>Student Registration</Text>

      <Section title="Identification">
        <Input
          label="Registration Number"
          value={form.registrationNumber}
          onChangeText={(v) => handleChange("registrationNumber", v)}
        />
      </Section>

      <Section title="Contact Details">
        <Input
          label="College Email"
          value={form.officialEmail}
          keyboardType="email-address"
          onChangeText={(v) => handleChange("officialEmail", v)}
        />
        <Input
          label="Mobile (+91)"
          value={form.mobile}
          keyboardType="numeric"
          onChangeText={(v) => handleChange("mobile", v)}
        />
      </Section>

      <Section title="Academic Information">
        <Input label="College" value={form.college} editable={false} />
        <DepartmentDropdown
          value={form.departmentId}
          onChange={(v) => handleChange("departmentId", v)}
          departments={departments}
        />
        <SectionDropdown
          value={form.section}
          onChange={(v) => handleChange("section", v)}
        />
        <Input
          label="Roll Number"
          value={form.rollNumber}
          keyboardType="numeric"
          onChangeText={(v) => handleChange("rollNumber", v)}
        />
      </Section>

      <Section title="Personal Information">
        <Input
          label="First Name"
          value={form.firstName}
          onChangeText={(v) => handleChange("firstName", v)}
        />
        <Input
          label="Last Name"
          value={form.lastName}
          onChangeText={(v) => handleChange("lastName", v)}
        />
        <GenderRadio
          value={form.gender}
          onChange={(v) => handleChange("gender", v)}
        />
        <DateInput
          label="Date of Birth (YYYY-MM-DD)"
          value={form.dateOfBirth}
          keyboardType="numeric"
          onChange={(v) => handleChange("dateOfBirth", v)}
        />
        {/* <CategoryDropdown
          value={form.category}
          onChange={(v) => handleChange("category", v)}
        /> */}
      </Section>

      <Section title="Credentials">
        <Input
          label="Password"
          secure
          value={form.password}
          onChangeText={(v) => handleChange("password", v)}
        />
        <Input
          label="Confirm Password"
          secure
          value={form.confirmPassword}
          onChangeText={(v) => handleChange("confirmPassword", v)}
        />
        {/* <Input
          label="Enter OTP"
          value={form.otp}
          onChangeText={(v) => handleChange("otp", v)}
        />
        <Button
          title="Send OTP"
          // onPress={handleSendOtp}
          style={{ marginBottom: 5 }} // Adjust based on your Input's bottom margin
        /> */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            width: "100%",
            gap: 10,
          }}
        >
          <View style={{ flex: 3 }}>
            <Input
              label="Enter OTP"
              value={form.otp}
              onChangeText={(v) => handleChange("otp", v)}
              containerStyle={{ paddingHorizontal: 0 }}
            />
          </View>
          <View style={{ flex: 2, paddingBottom: 15 }}>
            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              buttonStyle={{ height: 50 }}
            />
          </View>
        </View>
      </Section>

      <Section title="Documents">
        <UploadField
          label="Student Photo"
          image={studentPhoto}
          onPress={() => pickImage(setStudentPhoto)}
        />

        {/* <UploadField
          label="ID Card"
          image={idCardPhoto}
          onPress={() => pickImage(setIdCardPhoto)}
        /> */}
      </Section>

      <TouchableOpacity style={button} onPress={handleSubmit}>
        <Text style={{ color: "#fff" }}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={link}>Already have an account? Login here</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/* ---------------- Reusable Components ---------------- */

const Section = ({ title, children }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Input = ({ label, secure, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={labelStyle}>{label}</Text>
    <TextInput style={input} secureTextEntry={secure} {...props} />
  </View>
);

const GenderRadio = ({ value, onChange }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={labelStyle}>Gender</Text>
    <View style={{ flexDirection: "row", gap: 20 }}>
      {["MALE", "FEMALE"].map((g) => (
        <TouchableOpacity
          key={g}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          onPress={() => onChange(g)}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: "#111827",
              backgroundColor: value === g ? "#111827" : "#fff",
            }}
          />
          <Text>{g}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const DateInput = ({ label, value, onChange }) => {
  const [error, setError] = useState("");

  const handleDateChange = (text) => {
    onChange(text);
    if (text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      setError("Format: YYYY-MM-DD");
    } else {
      setError("");
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        style={input}
        value={value}
        onChangeText={handleDateChange}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />
      {error && <Text style={{ color: "red", fontSize: 11 }}>{error}</Text>}
    </View>
  );
};

const DepartmentDropdown = ({ value, onChange, departments }) => {
  const getDeptShortName = (dept) => {
    if (!dept) return "";
    return dept
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={labelStyle}>Department & Semester</Text>
      <View style={pickerWrapper}>
        <Picker selectedValue={value} onValueChange={onChange}>
          <Picker.Item label="Select Department & Semester" value="" />
          {departments.map((dept) => (
            <Picker.Item
              key={dept._id}
              label={`${getDeptShortName(dept.departmentName)} || Semester: ${dept.semester}`}
              value={dept._id}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const SectionDropdown = ({ value, onChange }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={labelStyle}>Section (Lab batch)</Text>
    <View style={pickerWrapper}>
      <Picker selectedValue={value} onValueChange={onChange}>
        <Picker.Item label="Select Section" value="" />
        <Picker.Item label="A" value="A" />
        <Picker.Item label="B" value="B" />
        <Picker.Item label="C" value="C" />
        <Picker.Item label="D" value="D" />
      </Picker>
    </View>
  </View>
);

const UploadField = ({ label, image, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
      backgroundColor: "#fff",
    }}
  >
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {image ? (
        <Image source={{ uri: image.uri }} style={{ width: 64, height: 64 }} />
      ) : (
        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>No file</Text>
      )}
    </View>

    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 12, color: "#6B7280" }}>
        {image ? "Tap to replace" : "Tap to select a file (jpg, png)"}
      </Text>
    </View>

    <View
      style={{
        backgroundColor: "#111827",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: "#fff" }}>Upload</Text>
    </View>
  </TouchableOpacity>
);

/* ---------------- Styles ---------------- */

const title = { fontSize: 22, fontWeight: "700", marginBottom: 16 };
const sectionTitle = { fontSize: 16, fontWeight: "600", marginBottom: 8 };
const labelStyle = { fontSize: 12, color: "#6B7280", marginBottom: 4 };
const input = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  padding: 10,
};
const pickerWrapper = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  overflow: "hidden",
};
const button = {
  backgroundColor: "#111827",
  padding: 14,
  borderRadius: 8,
  alignItems: "center",
  marginTop: 24,
};
const link = {
  marginTop: 16,
  color: "#2563EB",
  textAlign: "center",
};

export default StudentRegisterScreen;
