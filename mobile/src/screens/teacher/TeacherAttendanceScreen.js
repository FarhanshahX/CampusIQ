// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   TextInput,
//   Alert,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import { LineChart } from "react-native-chart-kit";
// import { Dimensions } from "react-native";
// import { useAuth } from "../../context/AuthContext";
// import api from "../../api/axios";

// const screenWidth = Dimensions.get("window").width;

// const AttendanceScreen = () => {
//   const user = useAuth().user;
//   const [subject, setSubject] = useState("");
//   const [departmentId, setDepartmentId] = useState("");
//   const [subjectId, setSubjectId] = useState("");
//   const [subjects, setSubjects] = useState([]);
//   const [department, setDepartment] = useState("");
//   const [semester, setSemester] = useState("");

//   const [sessionType, setSessionType] = useState("Lecture");
//   const [section, setSection] = useState("A");
//   const [duration, setDuration] = useState(10);
//   const [topic, setTopic] = useState("");
//   const [lecturePeriod, setLecturePeriod] = useState("");
//   const [sessionActive, setSessionActive] = useState(false);
//   const [timer, setTimer] = useState(0);

//   const [selectedMonth, setSelectedMonth] = useState("Overall");
//   const [selectedStudent, setSelectedStudent] = useState("All");

//   const [sessionId, setSessionId] = useState(null);
//   const [stats, setStats] = useState(null);

//   // Example chart data
//   // const attendanceData = [80, 82, 78, 85, 90];
//   const attendanceData = stats?.map((s) => s.total) || [0];

//   // ----------- FETCH SUBJECTS -----------
//   const fetchSubjects = async () => {
//     try {
//       const res = await api.get(`/subjects/${departmentId}`);
//       // Filter subjects assigned to this teacher
//       const teacherSubjects = res.data.filter(
//         (s) => s.assignedTeacher === user._id,
//       );
//       setSubjects(teacherSubjects);

//       if (teacherSubjects.length > 0) {
//         setSubjectId(teacherSubjects[0]._id);
//         setSubject(teacherSubjects[0].subjectName);
//         setSemester(teacherSubjects[0].semester);
//       }
//     } catch (error) {
//       console.log("Error fetching subjects:", error);
//     }
//   };

//   // ----------- FETCH DEPARTMENT -----------
//   const fetchDepartment = async () => {
//     try {
//       if (subjects.length > 0) {
//         setDepartment(subjects[0].departmentName);
//         setSemester(subjects[0].semester);
//       }
//     } catch (error) {
//       console.log("Error fetching department:", error);
//     }
//   };

//   const fetchSubjectByTeacher = async (teacherId) => {
//     try {
//       const res = await api.get(`/subjects/teacher/${teacherId}`);
//       setSubjects(res.data); // Set to the full array, not just [0]
//       if (res.data.length > 0) {
//         setSubjectId(res.data[0]._id);
//         setDepartmentId(res.data[0].department._id); // Fixed: single department
//         setSubject(res.data[0].subjectName);
//         setDepartment(res.data[0].department.departmentName); // Fixed: single department
//         setSemester(res.data[0].semester);
//       }
//     } catch (error) {
//       console.log("Error fetching subjects by teacher:", error);
//     }
//   };

//   // ----------- AUTO CALCULATE LECTURE PERIOD -----------
//   const calculateLecturePeriod = () => {
//     const now = new Date();

//     let start = new Date(now);

//     if (now.getMinutes() < 15) {
//       start.setMinutes(0);
//     } else if (now.getMinutes() < 45) {
//       start.setMinutes(30);
//     } else {
//       start.setHours(now.getHours() + 1);
//       start.setMinutes(0);
//     }

//     start.setSeconds(0);

//     let end = new Date(start);
//     end.setHours(start.getHours() + 1);

//     const format = (d) =>
//       `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;

//     setLecturePeriod(`${format(start)} - ${format(end)}`);
//   };

//   const fetchAttendanceStats = async () => {
//     try {
//       const res = await api.get(`/attendance/stats/subjectID`);

//       setStats(res.data);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchSubjectByTeacher(user._id);
//     } else {
//       console.log("user not found");
//     }
//     // fetchSubjects();
//     // if (departmentId) {
//     //   fetchDepartment();
//     // }
//     calculateLecturePeriod();
//     fetchAttendanceStats();
//   }, [user]);
//   // ----------- START SESSION -----------

//   const startAttendance = async () => {
//     try {
//       const [startTime, endTime] = lecturePeriod.split(" - ");

//       const res = await api.post("/attendance/start", {
//         subject: subjectId,
//         department: departmentId,
//         semester,
//         section,
//         sessionType,
//         lectureStart: startTime,
//         lectureEnd: endTime,
//         duration,
//         topic,
//         user,
//       });

//       setSessionId(res.data.session._id);
//       setSessionActive(true);
//       setTimer(duration * 60);

//       Alert.alert(
//         "Attendance Started",
//         "Students nearby can now mark attendance.",
//       );
//     } catch (error) {
//       console.log(error.response?.data);
//       Alert.alert("Error", "Failed to start attendance");
//     }
//   };

//   // ----------- COUNTDOWN TIMER -----------
//   useEffect(() => {
//     let interval;

//     if (sessionActive && timer > 0) {
//       interval = setInterval(() => {
//         setTimer((prev) => prev - 1);
//       }, 1000);
//     }

//     return () => clearInterval(interval);
//   }, [sessionActive, timer]);

//   const closeSession = async () => {
//     try {
//       await api.put(`/attendance/close/${sessionId}`);

//       setSessionActive(false);

//       Alert.alert("Attendance Closed", "Attendance session has ended.");

//       fetchAttendanceStats();
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const formatTime = (sec) => {
//     const m = Math.floor(sec / 60);
//     const s = sec % 60;
//     return `${m}:${s.toString().padStart(2, "0")}`;
//   };

//   return (
//     <ScrollView style={styles.container}>
//       {/* TITLE */}
//       <Text style={styles.title}>Start Attendance</Text>
//       <Text style={styles.subtitle}>
//         Create a new attendance session for your class
//       </Text>

//       {/* CARD */}
//       <View style={styles.card}>
//         {/* SUBJECT */}
//         {/* <Text style={styles.label}>Subject</Text>
//         <Picker
//           selectedValue={subjectId}
//           onValueChange={(itemValue) => {
//             setSubjectId(itemValue);
//             const selectedSubj = subjects.find((s) => s._id === itemValue);
//             if (selectedSubj) {
//               setSubject(selectedSubj.subjectName || "");
//               setSemester(selectedSubj.semester);
//             }
//           }}
//         >
//           <Picker.Item label="Select Subject" value="" />
//           {subjects.map((subj) => (
//             <Picker.Item
//               key={subj._id}
//               label={subj.subjectName}
//               value={subj._id}
//             />
//           ))}
//         </Picker> */}
//         <Text style={styles.label}>Subject</Text>
//         <Text style={styles.value}>{subject || ""}</Text>

//         {/* LECTURE PERIOD */}
//         <Text style={styles.label}>Lecture Period</Text>
//         <TextInput
//           value={lecturePeriod}
//           onChangeText={setLecturePeriod}
//           style={styles.input}
//         />

//         {/* CLASS */}
//         <Text style={styles.label}>Class / Department</Text>
//         <Text style={styles.value}>
//           {department || ""} – Semester {semester || ""}
//         </Text>

//         {/* SESSION TYPE */}
//         <Text style={styles.label}>Session Type</Text>

//         <Picker
//           selectedValue={sessionType}
//           onValueChange={(itemValue) => setSessionType(itemValue)}
//         >
//           <Picker.Item label="Lecture" value="Lecture" />
//           <Picker.Item label="Practical" value="Practical" />
//           <Picker.Item label="Extra Class" value="Extra Class" />
//         </Picker>

//         {/* SECTION (ONLY PRACTICAL) */}
//         {sessionType === "Practical" && (
//           <>
//             <Text style={styles.label}>Section</Text>

//             <Picker
//               selectedValue={section}
//               onValueChange={(v) => setSection(v)}
//             >
//               <Picker.Item label="A" value="A" />
//               <Picker.Item label="B" value="B" />
//               <Picker.Item label="C" value="C" />
//               <Picker.Item label="D" value="D" />
//             </Picker>
//           </>
//         )}

//         {/* SESSION DURATION */}
//         <Text style={styles.label}>Session Duration</Text>

//         <Picker
//           selectedValue={duration}
//           onValueChange={(itemValue) => setDuration(itemValue)}
//         >
//           <Picker.Item label="10 minutes" value={10} />
//           <Picker.Item label="15 minutes" value={15} />
//           <Picker.Item label="20 minutes" value={20} />
//         </Picker>

//         {/* TOPIC */}
//         <Text style={styles.label}>Topic / Remarks</Text>

//         <TextInput
//           placeholder="Optional: Topic covered in this class"
//           value={topic}
//           onChangeText={setTopic}
//           style={styles.input}
//         />

//         {/* START BUTTON */}
//         {!sessionActive && (
//           <TouchableOpacity
//             style={styles.startButton}
//             onPress={startAttendance}
//           >
//             <Text style={styles.startButtonText}>Start Attendance</Text>
//           </TouchableOpacity>
//         )}

//         {/* TIMER */}
//         {sessionActive && (
//           <Text style={styles.timer}>
//             Session Active • Time Left: {formatTime(timer)}
//           </Text>
//         )}
//         {sessionActive && (
//           <TouchableOpacity
//             style={{
//               backgroundColor: "red",
//               padding: 12,
//               borderRadius: 8,
//               marginTop: 10,
//             }}
//             onPress={closeSession}
//           >
//             <Text style={{ color: "white", textAlign: "center" }}>
//               End Attendance
//             </Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* ATTENDANCE ANALYTICS */}

//       <View style={styles.analyticsCard}>
//         <Text style={styles.sectionTitle}>Attendance Analytics</Text>

//         {/* FILTERS */}

//         <View style={styles.filterRow}>
//           <Picker
//             style={styles.filter}
//             selectedValue={selectedMonth}
//             onValueChange={(v) => setSelectedMonth(v)}
//           >
//             <Picker.Item label="Overall" value="Overall" />
//             <Picker.Item label="January" value="Jan" />
//             <Picker.Item label="February" value="Feb" />
//             <Picker.Item label="March" value="Mar" />
//           </Picker>

//           <Picker
//             style={styles.filter}
//             selectedValue={selectedStudent}
//             onValueChange={(v) => setSelectedStudent(v)}
//           >
//             <Picker.Item label="All Students" value="All" />
//             <Picker.Item label="Student 1" value="1" />
//             <Picker.Item label="Student 2" value="2" />
//           </Picker>
//         </View>

//         {/* CHART */}

//         <LineChart
//           data={{
//             labels: ["W1", "W2", "W3", "W4", "W5"],
//             datasets: [{ data: attendanceData }],
//           }}
//           width={screenWidth - 40}
//           height={220}
//           chartConfig={{
//             backgroundGradientFrom: "#fff",
//             backgroundGradientTo: "#fff",
//             color: () => "#2e86de",
//             labelColor: () => "#444",
//           }}
//         />

//         {/* SUMMARY */}

//         <View style={styles.summary}>
//           <Text style={styles.summaryText}>Total Lectures: 24</Text>
//           <Text style={styles.summaryText}>Average Attendance: 84%</Text>
//           <Text style={styles.summaryText}>Lowest Attendance: 65%</Text>
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// export default AttendanceScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f6fa",
//     padding: 16,
//   },

//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//   },

//   subtitle: {
//     color: "#666",
//     marginBottom: 15,
//   },

//   card: {
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 10,
//     marginBottom: 20,
//     elevation: 2,
//   },

//   label: {
//     fontWeight: "600",
//     marginTop: 10,
//   },

//   value: {
//     backgroundColor: "#f1f2f6",
//     padding: 10,
//     borderRadius: 6,
//     marginTop: 4,
//   },

//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     borderRadius: 6,
//     marginTop: 5,
//   },

//   startButton: {
//     backgroundColor: "#2e86de",
//     padding: 14,
//     borderRadius: 8,
//     marginTop: 20,
//     alignItems: "center",
//   },

//   startButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },

//   timer: {
//     marginTop: 15,
//     textAlign: "center",
//     fontSize: 16,
//     color: "green",
//   },

//   analyticsCard: {
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 10,
//     elevation: 2,
//   },

//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },

//   filterRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },

//   filter: {
//     width: "48%",
//   },

//   summary: {
//     marginTop: 10,
//   },

//   summaryText: {
//     fontSize: 14,
//     marginTop: 3,
//   },
// });

/**
 * TeacherAttendanceScreen.jsx
 *
 * Drop-in replacement for the teacher attendance module.
 * Sections:
 *   1. Start Attendance Card
 *   2. Attendance History (filterable table)
 *   3. Attendance Summary (synced with filters)
 *
 * Dependencies (same as before):
 *   @react-native-picker/picker
 *   react-native-chart-kit  (used only if you want the chart widget)
 *
 * API endpoints consumed:
 *   GET  /subjects/teacher/:teacherId   → teacher's subjects
 *   POST /attendance/start              → start session
 *   PUT  /attendance/close/:sessionId   → close session
 *   GET  /attendance/history            → { history[], summary{} }  (new unified endpoint – see note)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MONTHS = [
  { label: "Overall", value: "overall" },
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const SESSION_TYPES = ["Lecture", "Practical", "Extra Class"];
const SECTIONS = ["A", "B", "C", "D"];
const DURATIONS = [
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "20 minutes", value: 20 },
  { label: "30 minutes", value: 30 },
];

// ─────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────
const C = {
  bg: "#F0F4FF",
  surface: "#FFFFFF",
  primary: "#1D3557",
  accent: "#457B9D",
  accentLight: "#A8C5DA",
  success: "#2D6A4F",
  successBg: "#D8F3DC",
  danger: "#9B2226",
  dangerBg: "#FFE0E0",
  warn: "#E76F51",
  text: "#1A1A2E",
  muted: "#6C757D",
  border: "#DDE3F0",
  live: "#E63946",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const snapToSlot = () => {
  const now = new Date();
  const start = new Date(now);
  if (now.getMinutes() < 15) start.setMinutes(0);
  else if (now.getMinutes() < 45) start.setMinutes(30);
  else {
    start.setHours(now.getHours() + 1);
    start.setMinutes(0);
  }
  start.setSeconds(0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  const fmt = (d) =>
    `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

const formatTimer = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

const pct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

/** Thin horizontal divider */
const Divider = () => <View style={s.divider} />;

/** Section heading */
const SectionHeading = ({ title, subtitle }) => (
  <View style={s.headingWrap}>
    <Text style={s.headingText}>{title}</Text>
    {subtitle ? <Text style={s.headingSub}>{subtitle}</Text> : null}
  </View>
);

/** Pill badge */
const Badge = ({ label, color, bg }) => (
  <View style={[s.badge, { backgroundColor: bg }]}>
    <Text style={[s.badgeText, { color }]}>{label}</Text>
  </View>
);

/** Progress bar */
const ProgressBar = ({ value }) => (
  <View style={s.progressTrack}>
    <View
      style={[
        s.progressFill,
        {
          width: `${Math.min(value, 100)}%`,
          backgroundColor:
            value >= 75 ? C.success : value >= 50 ? C.warn : C.danger,
        },
      ]}
    />
  </View>
);

/** Read-only info row */
const InfoRow = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value || "—"}</Text>
  </View>
);

/** Stat tile for summary */
const StatTile = ({ label, value, accent }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, accent && { color: C.accent }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function TeacherAttendanceScreen() {
  const { user } = useAuth();

  // ── Session form ──────────────────────────
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null); // full subject object
  const [sessionType, setSessionType] = useState("Lecture");
  const [section, setSection] = useState("A");
  const [duration, setDuration] = useState(10);
  const [topic, setTopic] = useState("");
  const [lecturePeriod, setLecturePeriod] = useState("");

  // ── Active session ────────────────────────
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── History / filters ─────────────────────
  const [filterMonth, setFilterMonth] = useState("overall");
  const [filterStudent, setFilterStudent] = useState("all");
  const [allStudents, setAllStudents] = useState([]); // [{_id, name}]
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    rate: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchSubjectsByTeacher(user._id);
    }
    setLecturePeriod(snapToSlot());
  }, [user]);

  // pulse animation for live dot
  useEffect(() => {
    if (!sessionActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sessionActive]);

  // countdown
  useEffect(() => {
    if (!sessionActive || timer <= 0) return;
    const id = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [sessionActive, timer]);

  // auto-close when timer hits 0
  useEffect(() => {
    if (sessionActive && timer === 0) handleCloseSession();
  }, [timer]);

  // re-fetch history when filters change
  useEffect(() => {
    if (selectedSubject) fetchHistory();
  }, [filterMonth, filterStudent, selectedSubject]);

  // ─────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────
  const fetchSubjectsByTeacher = async (teacherId) => {
    try {
      const res = await api.get(`/subjects/teacher/${teacherId}`);
      const data = res.data;
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubject(data[0]);
      }
    } catch (e) {
      console.log("fetchSubjectsByTeacher:", e);
    }
  };

  const handleStartSession = async () => {
    if (!selectedSubject) {
      Alert.alert("No Subject", "No subject found for your account.");
      return;
    }
    try {
      const [startTime, endTime] = lecturePeriod.split(" - ");
      const res = await api.post("/attendance/start", {
        subject: selectedSubject._id,
        department: selectedSubject.department._id,
        semester: selectedSubject.semester,
        section,
        sessionType,
        lectureStart: startTime.trim(),
        lectureEnd: endTime.trim(),
        duration,
        topic,
        user: user._id,
      });
      setSessionId(res.data.session._id);
      setSessionActive(true);
      setTimer(duration * 60);
      Alert.alert(
        "Session Started",
        "Students nearby can now mark attendance.",
      );
    } catch (e) {
      console.log(e.response?.data);
      Alert.alert(
        "Error",
        e.response?.data?.message || "Failed to start session.",
      );
    }
  };

  const handleCloseSession = async () => {
    try {
      await api.put(`/attendance/close/${sessionId}`);
      setSessionActive(false);
      setSessionId(null);
      Alert.alert("Session Ended", "Attendance session has been closed.");
      fetchHistory();
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * NOTE: You'll need a backend route:
   *   GET /attendance/history?subjectId=&month=&studentId=
   * that returns { history: [...], summary: {...}, students: [...] }
   *
   * history items shape:
   *   { _id, date, studentName, studentRoll, status, sessionType, topic }
   *
   * summary shape:
   *   { totalClasses, attended, absent, rate }
   *
   * students shape:
   *   [{ _id, name, roll }]
   */
  const fetchHistory = useCallback(async () => {
    if (!selectedSubject) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: selectedSubject._id });
      if (filterMonth !== "overall") params.append("month", filterMonth);
      if (filterStudent !== "all") params.append("studentId", filterStudent);

      const res = await api.get(`/attendance/history?${params.toString()}`);
      setHistory(res.data.history || []);
      setSummary(
        res.data.summary || {
          totalClasses: 0,
          attended: 0,
          absent: 0,
          rate: 0,
        },
      );
      if (res.data.students && filterStudent === "all") {
        setAllStudents(res.data.students || []);
      }
    } catch (e) {
      console.log("fetchHistory:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedSubject, filterMonth, filterStudent]);

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────
  const renderHistoryRow = ({ item, index }) => (
    <View style={[s.tableRow, index % 2 === 0 && s.tableRowAlt]}>
      <Text style={[s.tableCell, { flex: 1.8 }]}>{item.date}</Text>
      <Text style={[s.tableCell, { flex: 2.5 }]} numberOfLines={1}>
        {item.studentName}
      </Text>
      <Text style={[s.tableCell, { flex: 1.2 }]}>{item.sessionType}</Text>
      <View style={[s.tableCell, { flex: 1.2, alignItems: "center" }]}>
        <Badge
          label={item.status}
          color={item.status === "PRESENT" ? C.success : C.danger}
          bg={item.status === "PRESENT" ? C.successBg : C.dangerBg}
        />
      </View>
    </View>
  );

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Attendance</Text>
          <Text style={s.pageSub}>
            Manage sessions & track student presence
          </Text>
        </View>
        {sessionActive && (
          <View style={s.liveChip}>
            <Animated.View
              style={[s.liveDot, { transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════
          SECTION 1 — START / ACTIVE SESSION
      ══════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeading
          title={sessionActive ? "Session Active" : "Start Attendance"}
          subtitle={
            sessionActive
              ? `Time remaining: ${formatTimer(timer)}`
              : "Configure and launch an attendance session"
          }
        />

        {/* Subject + Department (read-only) */}
        <InfoRow label="Subject" value={selectedSubject?.subjectName} />
        <InfoRow
          label="Department & Semester"
          value={
            selectedSubject
              ? `${selectedSubject.department?.departmentName} • Sem ${selectedSubject.semester}`
              : undefined
          }
        />

        <Divider />

        {/* Lecture Period */}
        <Text style={s.fieldLabel}>Lecture Period</Text>
        <TextInput
          style={s.textInput}
          value={lecturePeriod}
          onChangeText={setLecturePeriod}
          editable={!sessionActive}
          placeholder="e.g. 9:00 - 10:00"
          placeholderTextColor={C.muted}
        />

        {/* Session Type */}
        <Text style={s.fieldLabel}>Session Type</Text>
        <View style={[s.pickerWrap, sessionActive && s.disabled]}>
          <Picker
            selectedValue={sessionType}
            onValueChange={setSessionType}
            enabled={!sessionActive}
            style={s.picker}
          >
            {SESSION_TYPES.map((t) => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>

        {/* Section — only for Practical */}
        {sessionType === "Practical" && (
          <>
            <Text style={s.fieldLabel}>Batch / Section</Text>
            <View style={[s.pickerWrap, sessionActive && s.disabled]}>
              <Picker
                selectedValue={section}
                onValueChange={setSection}
                enabled={!sessionActive}
                style={s.picker}
              >
                {SECTIONS.map((sec) => (
                  <Picker.Item key={sec} label={`Section ${sec}`} value={sec} />
                ))}
              </Picker>
            </View>
          </>
        )}

        {/* Duration */}
        <Text style={s.fieldLabel}>Marking Window</Text>
        <View style={[s.pickerWrap, sessionActive && s.disabled]}>
          <Picker
            selectedValue={duration}
            onValueChange={setDuration}
            enabled={!sessionActive}
            style={s.picker}
          >
            {DURATIONS.map((d) => (
              <Picker.Item key={d.value} label={d.label} value={d.value} />
            ))}
          </Picker>
        </View>

        {/* Topic */}
        <Text style={s.fieldLabel}>Topic / Remarks</Text>
        <TextInput
          style={[s.textInput, { minHeight: 64, textAlignVertical: "top" }]}
          value={topic}
          onChangeText={setTopic}
          placeholder="Optional — topic covered today"
          placeholderTextColor={C.muted}
          multiline
          editable={!sessionActive}
        />

        {/* Action Buttons */}
        {!sessionActive ? (
          <TouchableOpacity style={s.primaryBtn} onPress={handleStartSession}>
            <Text style={s.primaryBtnText}>Start Attendance Session</Text>
          </TouchableOpacity>
        ) : (
          <View>
            {/* Timer bar */}
            <ProgressBar value={(timer / (duration * 60)) * 100} />
            <Text style={s.timerLabel}>
              {formatTimer(timer)} remaining · Bluetooth active
            </Text>
            <TouchableOpacity style={s.dangerBtn} onPress={handleCloseSession}>
              <Text style={s.dangerBtnText}>End Session Early</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ══════════════════════════════════════
          SECTION 2 — ATTENDANCE HISTORY
      ══════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeading
          title="Attendance History"
          subtitle="Filter by month or individual student"
        />

        {/* Filters row */}
        <View style={s.filterRow}>
          <View style={s.filterItem}>
            <Text style={s.filterLabel}>Month</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={filterMonth}
                onValueChange={setFilterMonth}
                style={s.picker}
              >
                {MONTHS.map((m) => (
                  <Picker.Item key={m.value} label={m.label} value={m.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[s.filterItem, { marginLeft: 10 }]}>
            <Text style={s.filterLabel}>Student</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={filterStudent}
                onValueChange={setFilterStudent}
                style={s.picker}
              >
                <Picker.Item label="All Students" value="all" />
                {allStudents.map((st) => (
                  <Picker.Item key={st._id} label={st.name} value={st._id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <Divider />

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeadCell, { flex: 1.8 }]}>Date</Text>
          <Text style={[s.tableHeadCell, { flex: 2.5 }]}>Student</Text>
          <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Type</Text>
          <Text style={[s.tableHeadCell, { flex: 1.2 }]}>Status</Text>
        </View>

        {/* Table body */}
        {historyLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 24 }} />
        ) : history.length === 0 ? (
          <Text style={s.emptyText}>
            No records found for the selected filters.
          </Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            renderItem={renderHistoryRow}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* ══════════════════════════════════════
          SECTION 3 — ATTENDANCE SUMMARY
      ══════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeading
          title="Attendance Summary"
          subtitle={
            filterMonth !== "overall" || filterStudent !== "all"
              ? `Filtered · ${
                  MONTHS.find((m) => m.value === filterMonth)?.label ??
                  "Overall"
                }${filterStudent !== "all" ? " · Selected Student" : ""}`
              : "Overall statistics"
          }
        />

        {/* Stat tiles */}
        <View style={s.statsRow}>
          <StatTile label="Total Classes" value={summary.totalClasses} />
          <StatTile label="Attended" value={summary.attended} accent />
          <StatTile label="Absent" value={summary.absent} />
          <StatTile
            label="Rate"
            value={`${summary.rate ?? pct(summary.attended, summary.totalClasses)}%`}
            accent
          />
        </View>

        <Divider />

        {/* Attendance rate bar */}
        <View style={s.rateRow}>
          <Text style={s.rateLabel}>Attendance Rate</Text>
          <Text style={s.rateValue}>
            {summary.rate ?? pct(summary.attended, summary.totalClasses)}%
          </Text>
        </View>
        <ProgressBar
          value={summary.rate ?? pct(summary.attended, summary.totalClasses)}
        />

        {/* Threshold note */}
        {(summary.rate ?? pct(summary.attended, summary.totalClasses)) < 75 && (
          <View style={s.warnBanner}>
            <Text style={s.warnText}>
              ⚠ Attendance below 75% threshold. Students may be flagged.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },

  // ── Page Header ──────────────────────────
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 2,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.live,
    letterSpacing: 1,
  },

  // ── Card ─────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1D3557",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // ── Section Heading ───────────────────────
  headingWrap: {
    marginBottom: 16,
  },
  headingText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: -0.3,
  },
  headingSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 3,
  },

  // ── Divider ───────────────────────────────
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },

  // ── Info Row ─────────────────────────────
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoLabel: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  // ── Form Fields ───────────────────────────
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#FAFBFF",
  },
  pickerWrap: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: "#FAFBFF",
    overflow: "hidden",
  },
  picker: {
    height: 48,
    color: C.text,
  },
  disabled: {
    opacity: 0.5,
  },

  // ── Buttons ───────────────────────────────
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderColor: C.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  dangerBtnText: {
    color: C.danger,
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Timer ─────────────────────────────────
  timerLabel: {
    textAlign: "center",
    fontSize: 12,
    color: C.muted,
    marginTop: 6,
    marginBottom: 12,
  },

  // ── Progress ──────────────────────────────
  progressTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: 6,
    borderRadius: 99,
  },

  // ── Filters ───────────────────────────────
  filterRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 5,
  },

  // ── Table ─────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeadCell: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accent,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: "#FAFBFF",
  },
  tableCell: {
    fontSize: 13,
    color: C.text,
  },
  emptyText: {
    textAlign: "center",
    color: C.muted,
    fontSize: 13,
    paddingVertical: 24,
  },

  // ── Badge ────────────────────────────────
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  // ── Summary Stats ─────────────────────────
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statTile: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 3,
    textTransform: "uppercase",
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  rateLabel: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
  },
  rateValue: {
    fontSize: 15,
    color: C.primary,
    fontWeight: "800",
  },

  // ── Warn Banner ───────────────────────────
  warnBanner: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.warn,
  },
  warnText: {
    fontSize: 12,
    color: "#7B4000",
    fontWeight: "500",
  },
});
