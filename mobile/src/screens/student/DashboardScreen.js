// import { ScrollView, View, Text, TouchableOpacity } from "react-native";
// import { useAuth } from "../../context/AuthContext";
// import { LineChart } from "react-native-chart-kit";
// import { Dimensions } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// const screenWidth = Dimensions.get("window").width;

// const DashboardScreen = () => {
//   const { user, logout } = useAuth();

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
//       {/* 📝 TO-DO */}
//       <View style={styles.card}>
//         <View style={styles.rowBetween}>
//           <Text style={styles.sectionTitle}>To-Do</Text>
//           <TouchableOpacity style={styles.plusBtn}>
//             <Ionicons name="add" size={20} color="#fff" />
//           </TouchableOpacity>
//         </View>

//         <Text style={{ color: "#9CA3AF", marginTop: 10 }}>
//           No tasks added yet
//         </Text>
//       </View>

//       {/* 📊 CGPA */}
//       <View style={styles.card}>
//         <Text style={styles.sectionTitle}>Current CGPA</Text>
//         <Text style={styles.cgpa}>8.75</Text>

//         <LineChart
//           data={{
//             labels: ["S1", "S2", "S3", "S4", "S5", "S6"],
//             datasets: [{ data: [7.5, 7.8, 8.1, 8.3, 8.5, 8.75] }],
//           }}
//           width={screenWidth - 40}
//           height={180}
//           withDots={false}
//           chartConfig={{
//             backgroundGradientFrom: "#fff",
//             backgroundGradientTo: "#fff",
//             color: () => "#1D4ED8",
//             labelColor: () => "#9CA3AF",
//           }}
//         />
//       </View>

//       {/* 📘 Attendance */}
//       <View style={styles.attendanceCard}>
//         <Text style={{ color: "#fff", fontSize: 16 }}>Current Attendance</Text>
//         <Text style={styles.attendanceText}>92.4%</Text>
//       </View>

//       {/* 🔵 Progress Circles Placeholder */}
//       <View style={styles.row}>
//         <View style={styles.smallCard}>
//           <Text style={styles.sectionTitle}>Experiments</Text>
//           <Text style={styles.progressText}>3 / 10</Text>
//         </View>

//         <View style={styles.smallCard}>
//           <Text style={styles.sectionTitle}>Assignments</Text>
//           <Text style={styles.progressText}>2 / 3</Text>
//         </View>
//       </View>

//       {/* 📈 Internal Assessment */}
//       <View style={styles.card}>
//         <Text style={styles.sectionTitle}>Internal Assessment Scores</Text>

//         <LineChart
//           data={{
//             labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
//             datasets: [{ data: [15, 18, 17, 19, 20, 21] }],
//           }}
//           width={screenWidth - 40}
//           height={180}
//           withDots={true}
//           chartConfig={{
//             backgroundGradientFrom: "#fff",
//             backgroundGradientTo: "#fff",
//             color: () => "#1D4ED8",
//             labelColor: () => "#9CA3AF",
//           }}
//         />
//       </View>
//     </ScrollView>
//   );
// };

// const styles = {
//   header: {
//     backgroundColor: "#fff",
//     padding: 20,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   name: { fontSize: 20, fontWeight: "700" },
//   reg: { color: "#2563EB", marginTop: 2 },
//   meta: { color: "#6B7280", marginTop: 2 },

//   card: {
//     backgroundColor: "#fff",
//     margin: 16,
//     padding: 16,
//     borderRadius: 16,
//   },

//   smallCard: {
//     flex: 1,
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 16,
//     marginHorizontal: 8,
//   },

//   attendanceCard: {
//     backgroundColor: "#1D4ED8",
//     margin: 16,
//     padding: 20,
//     borderRadius: 16,
//   },

//   attendanceText: {
//     color: "#fff",
//     fontSize: 28,
//     fontWeight: "700",
//     marginTop: 8,
//   },

//   cgpa: {
//     fontSize: 32,
//     fontWeight: "700",
//     color: "#1D4ED8",
//     marginBottom: 10,
//   },

//   row: {
//     flexDirection: "row",
//     paddingHorizontal: 8,
//   },

//   rowBetween: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//   },

//   progressText: {
//     fontSize: 18,
//     marginTop: 8,
//     color: "#1D4ED8",
//   },

//   plusBtn: {
//     backgroundColor: "#1D4ED8",
//     padding: 8,
//     borderRadius: 8,
//   },
// };

// const logoutBtn = {
//   backgroundColor: "#DC2626",
//   padding: 14,
//   borderRadius: 8,
//   alignItems: "center",
//   marginTop: 24,
// };

// export default DashboardScreen;

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [student, setStudent] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [fetching, setFetching] = useState(false);
  const [internal, setInternal] = useState(Array(6).fill(""));
  const [experiments, setExperiments] = useState(Array(10).fill(""));
  const [assignments, setAssignments] = useState(Array(2).fill(""));

  const { user } = useAuth();

  React.useEffect(() => {
    if (!user || !user._id) return; // guard against undefined

    api
      .get(`/admin/students/${user._id}`)
      .then((res) => {
        setStudent([res.data]);
        fetchSubjects(res.data.department._id);
      })
      .catch(console.error);
  }, [user]);

  React.useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]._id);
    }
  }, [subjects, selectedSubject]);

  React.useEffect(() => {
    if (selectedSubject) {
      fetchScores(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchSubjects = async (departmentId) => {
    const subjectData = await api.get(`/subjects/${departmentId}`);
    console.log("Fetched subjects:", subjectData.data);
    setSubjects(subjectData.data);
    setSelectedSubject(subjectData.data[0]?.name || "Select Subject");
  };

  const fetchScores = React.useCallback(
    async (subject) => {
      resetFields();
      setFetching(true);
      try {
        // Fetch marks for the student
        const res = await api.get(
          `/scores/${user._id}/${encodeURIComponent(subject)}`,
        );
        const { marks } = res.data || {};

        if (!marks) return;

        if (marks.internalTests) {
          setInternal(
            Array(6)
              .fill("")
              .map((_, i) =>
                marks.internalTests[i] != null
                  ? String(marks.internalTests[i])
                  : "",
              ),
          );
        }
        if (marks.experiments) {
          setExperiments(
            Array(10)
              .fill("")
              .map((_, i) =>
                marks.experiments[i] != null
                  ? String(marks.experiments[i])
                  : "",
              ),
          );
        }
        if (marks.assignments) {
          setAssignments(
            Array(2)
              .fill("")
              .map((_, i) =>
                marks.assignments[i] != null
                  ? String(marks.assignments[i])
                  : "",
              ),
          );
        }
        if (marks.attendanceScore != null)
          setAttendance(String(marks.attendanceScore));
        if (marks.practicalOral != null)
          setPractical(String(marks.practicalOral));
        if (marks.theory != null) setTheory(String(marks.theory));
      } catch (_) {
        // No saved data yet — fields stay empty
      } finally {
        setFetching(false);
      }
    },
    [user._id],
  );

  // Guard against undefined student data
  const cgpa = student[0]?.cgpa || [];
  const cgpaData = cgpa.filter((val) => val !== 0);
  const semesters = cgpaData.map((_, index) => `S${index + 1}`);
  const CurrntCgpa =
    student[0]?.cgpa?.[student[0]?.department?.semester - 2] || 0;
  const moduleMarks = [65, 70, 75, 72, 80, 85];

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f6f9" }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 1️⃣ ANNOUNCEMENTS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Important Announcements</Text>
          <Text style={styles.cardContent}>
            • Internal exam starts next Monday.
          </Text>
        </View>

        {/* 2️⃣ TODO */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Todo Tasks</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={{ color: "#fff" }}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardContent}>• Complete DBMS Assignment</Text>
        </View>

        {/* 3️⃣ CGPA */}
        {/* <View style={styles.card}>
          <Text style={styles.cgpa}>Current CGPA: {CurrntCgpa}</Text>

          <LineChart
            data={{
              labels: semesters,
              datasets: [{ data: cgpaData }],
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
          />
        </View> */}
        {/* In DashboardScreen.js, replace the CGPA chart section */}
        {cgpaData.length > 0 ? (
          <LineChart
            data={{
              labels: semesters,
              datasets: [{ data: cgpaData }],
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
          />
        ) : (
          <Text style={styles.noDataText}>No CGPA data available</Text>
        )}

        {/* 4️⃣ ATTENDANCE */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Attendance</Text>
          <Text style={styles.bigText}>86%</Text>
        </View> */}
        <View style={styles.attendanceCard}>
          <Text style={{ color: "#fff", fontSize: 16 }}>
            Current Attendance (Overall)
          </Text>
          <Text style={styles.attendanceText}>92.4%</Text>
        </View>

        {/* Subject Picker */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>SUBJECT</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedSubject}
              onValueChange={(value) => setSelectedSubject(value)}
              style={styles.picker}
            >
              {subjects.length > 0 ? (
                subjects.map((sub) => (
                  <Picker.Item
                    key={sub._id}
                    label={sub.subjectName}
                    value={sub._id}
                  />
                ))
              ) : (
                <Picker.Item label="Loading subjects..." value="" />
              )}
            </Picker>
          </View>

          {fetching && (
            <View style={styles.banner}>
              <ActivityIndicator size="small" color="#3B5BDB" />
              <Text style={styles.bannerText}>Loading scores…</Text>
            </View>
          )}
          {!fetching && (
            <View style={[styles.banner, styles.bannerSuccess]}>
              <Text style={styles.bannerSuccessText}>
                ✓ Showing saved data for this subject
              </Text>
            </View>
          )}
        </View>

        {/* 5️⃣ PROGRESS DONUT (Simplified Placeholder) */}
        {/* <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Experiments</Text>
            <Text style={styles.bigText}>7 / 10</Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Assignments</Text>
            <Text style={styles.bigText}>1 / 2</Text>
          </View>
        </View> */}
        <View style={styles.row}>
          {/* Experiments Card */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Experiments</Text>
            <View style={styles.progressContainer}>
              <AnimatedCircularProgress
                size={80}
                width={8}
                fill={(7 / 10) * 100}
                tintColor="#2ecc71"
                backgroundColor="#eeeeee"
                rotation={0}
                lineCap="round"
              >
                {() => <Text style={styles.insideText}>7/10</Text>}
              </AnimatedCircularProgress>
            </View>
          </View>

          {/* Assignments Card */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Assignments</Text>
            <View style={styles.progressContainer}>
              <AnimatedCircularProgress
                size={80}
                width={8}
                fill={(1 / 2) * 100}
                tintColor="#3498db"
                backgroundColor="#eeeeee"
                rotation={0}
                lineCap="round"
              >
                {() => <Text style={styles.insideText}>1/2</Text>}
              </AnimatedCircularProgress>
            </View>
          </View>
        </View>

        {/* 6️⃣ SUBJECT DROPDOWN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Module-wise Marks</Text>

          {/* Simple Dropdown Placeholder */}
          <TouchableOpacity style={styles.dropdown}>
            <Text>{selectedSubject}</Text>
          </TouchableOpacity>

          <LineChart
            data={{
              labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
              datasets: [{ data: moduleMarks }],
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
  labelColor: () => "#555",
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  halfCard: {
    width: "48%",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
  },
  picker: { height: 48, color: "#111827" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerText: { fontSize: 12, color: "#3B5BDB" },
  bannerSuccess: { backgroundColor: "#F0FDF4" },
  bannerSuccessText: { fontSize: 12, color: "#16A34A", fontWeight: "500" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardContent: {
    color: "#555",
  },
  cgpa: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bigText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  addBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  attendanceCard: {
    backgroundColor: "#000000",
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },

  attendanceText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  insideText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});

export default DashboardScreen;
