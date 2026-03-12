import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const StudentHeader = () => {
  const navigation = useNavigation();
  const [students, setStudents] = React.useState([]);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user || !user._id) return; // guard against undefined

    api
      .get(`/admin/students/${user._id}`)
      .then((res) => setStudents([res.data]))
      .catch(console.error);
  }, [user]);

  if (!students || students.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const student = students[0] || null; // Assuming first student is the current one

  // Generate Department Short Name (Initials)
  const getDeptShortName = (dept) => {
    if (!dept) return "";
    return dept
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* LEFT SIDE */}
      <View style={styles.leftContainer}>
        {/* Student Photo */}
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Image
            source={{
              uri:
                student.studentPhoto ||
                "https://i0.wp.com/picjumbo.com/wp-content/uploads/dark-portrait-of-woman-with-hair-over-her-face-free-image.jpeg?h=800&quality=80",
            }}
            style={styles.image}
          />
        </TouchableOpacity>

        {/* Student Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {student.firstName} {student.lastName}
          </Text>

          <Text style={styles.registration}>{student.registrationNumber}</Text>

          <Text style={styles.meta}>
            {getDeptShortName(student.department.departmentName)} | Sem{" "}
            {student.department.semester} | Lab {student.section} | Roll{" "}
            {student.rollNumber}
          </Text>
        </View>
      </View>

      {/* RIGHT SIDE */}
      <TouchableOpacity onPress={() => navigation.navigate("Messages")}>
        <Ionicons name="notifications-outline" size={26} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  infoContainer: {
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  registration: {
    fontSize: 13,
    color: "#555",
  },
  meta: {
    fontSize: 12,
    color: "#777",
  },
});

export default StudentHeader;
