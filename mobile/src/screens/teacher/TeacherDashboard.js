import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const teacher = {
    name: "Dr. Rajesh Sharma",
    department: "Computer Engineering",
    subject: "Software Engineering",
  };

  return (
    <ScrollView style={styles.container}>
      {/* TOP INFO CARD */}
      <View style={styles.profileCard}>
        <Text style={styles.name}>{teacher.name}</Text>
        <Text style={styles.info}>Department: {teacher.department}</Text>
        <Text style={styles.info}>Subject: {teacher.subject}</Text>
      </View>
      <TouchableOpacity style={logoutBtn} onPress={logout}>
        <Text style={{ color: "#fff" }}>Logout</Text>
      </TouchableOpacity>

      {/* DASHBOARD CONTENT */}
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>120</Text>
          <Text style={styles.cardLabel}>Total Students</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber}>92%</Text>
          <Text style={styles.cardLabel}>Avg Attendance</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber}>76%</Text>
          <Text style={styles.cardLabel}>Class Avg Marks</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber}>5</Text>
          <Text style={styles.cardLabel}>Pending Evaluations</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F3F4F6",
  },
  profileCard: {
    backgroundColor: "#2563EB",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    color: "#E0E7FF",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563EB",
  },
  cardLabel: {
    marginTop: 5,
    color: "#6B7280",
  },
});

const logoutBtn = {
  backgroundColor: "#DC2626",
  padding: 14,
  borderRadius: 8,
  alignItems: "center",
  marginTop: 24,
};
