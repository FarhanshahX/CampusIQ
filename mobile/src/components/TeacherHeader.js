import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const TeacherHeader = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [teacher, setTeacher] = useState(null);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!user || !user._id) return;

    const fetchTeacherDetails = async () => {
      try {
        const [teacherRes, subjectsRes] = await Promise.all([
          api.get(`/admin/teachers/${user._id}`),
          api.get(`/subjects/teacher/${user._id}`),
        ]);

        setTeacher(teacherRes.data);
        if (subjectsRes.data && subjectsRes.data.length > 0) {
          setSubjects(subjectsRes.data);
        }
      } catch (error) {
        console.error("Error fetching teacher header details:", error);
      }
    };

    fetchTeacherDetails();
  }, [user]);

  if (!teacher) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Generate Initials/Short Name e.g. "Artificial Intelligence and Data Science" -> "AI&DS" or "AIDS"
  const getInitials = (text) => {
    if (!text) return "";

    // Custom handling if it contains 'and' to convert to '&'
    const words = text.split(" ");
    let initials = "";
    words.forEach((word) => {
      if (word.toLowerCase() === "and") {
        initials += "&";
      } else if (word.length > 0) {
        initials += word[0].toUpperCase();
      }
    });
    return initials;
  };

  const deptShortName = teacher.department
    ? getInitials(teacher.department.departmentName)
    : "";
  const semesterStr = teacher.department?.semester
    ? `Sem ${teacher.department.semester}`
    : "";

  const subjectsStr =
    subjects.length > 0
      ? subjects.map((sub) => getInitials(sub.subjectName)).join(", ")
      : "No Subjects";

  // Build the meta string (e.g. AI&DS || Sem 6 || SEPM)
  const metaParts = [];
  if (deptShortName) metaParts.push(deptShortName);
  if (semesterStr) metaParts.push(semesterStr);
  if (subjectsStr) metaParts.push(subjectsStr);
  const metaString = metaParts.join(" || ");

  return (
    <View style={styles.container}>
      {/* LEFT SIDE */}
      <View style={styles.leftContainer}>
        {/* Profile Icon / Flow to Profile Screen */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={styles.profileIconContainer}
        >
          {teacher.photoUrl ? (
            <Image
              source={{
                uri:
                  teacher.photoUrl ||
                  "https://i0.wp.com/picjumbo.com/wp-content/uploads/dark-portrait-of-woman-with-hair-over-her-face-free-image.jpeg?h=800&quality=80",
              }}
              style={styles.profilePhoto}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={54} color="#6B7280" />
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {teacher.firstName} {teacher.lastName}
          </Text>

          <Text style={styles.designation}>
            {teacher.employeeId} • {teacher.designation || "Faculty"}
          </Text>

          <Text style={styles.meta}>{metaString}</Text>
        </View>
      </View>

      {/* RIGHT SIDE */}
      <TouchableOpacity onPress={() => navigation.navigate("Announcements")}>
        <Ionicons name="notifications-outline" size={26} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Ensures text can wrap if too long
  },
  profileIconContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  profilePhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  infoContainer: {
    justifyContent: "center",
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  designation: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 1,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
});

export default TeacherHeader;
