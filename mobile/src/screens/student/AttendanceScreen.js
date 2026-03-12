// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Alert,
// } from "react-native";
// import api from "../../api/axios";
// import { useAuth } from "../../context/AuthContext";

// export default function StudentAttendanceScreen() {
//   const [isInRange, setIsInRange] = useState(false);
//   const [bluetoothToken, setBluetoothToken] = useState(null);
//   const [activeSession, setActiveSession] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [summary, setSummary] = useState({
//     total: 0,
//     attended: 0,
//     rate: 0,
//   });
//   const { user } = useAuth();

//   // Detect active attendance session
//   useEffect(() => {
//     checkAttendanceSession();
//     fetchAttendanceHistory();
//   }, []);

//   // Simulated Bluetooth Range Check
//   const checkAttendanceSession = async () => {
//     try {
//       const res = await api.get("/attendance/active");

//       if (res.data) {
//         setActiveSession(res.data[0]);
//         // setBluetoothToken(res.data[0].bluetoothToken);

//         // simulate bluetooth range
//         setIsInRange(true);
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // Mark Attendance
//   const markAttendance = async () => {
//     if (!activeSession) return;

//     try {
//       await api.post("/attendance/mark", {
//         sessionId: activeSession._id,
//         studentId: user._id,
//         bluetoothToken: activeSession.bluetoothToken,
//       });

//       Alert.alert("Success", "Attendance Marked");

//       fetchAttendanceHistory();
//     } catch (err) {
//       Alert.alert("Error", "Unable to mark attendance");
//     }
//   };

//   // Fetch History
//   const fetchAttendanceHistory = async () => {
//     try {
//       const res = await api.get("/attendance/student-history");

//       setHistory(res.data.history);
//       setSummary(res.data.summary);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const renderHistory = ({ item }) => (
//     <View style={styles.historyCard}>
//       <View style={styles.dateBox}>
//         <Text style={styles.month}>{item.month}</Text>
//         <Text style={styles.date}>{item.date}</Text>
//       </View>

//       <View style={{ flex: 1 }}>
//         <Text style={styles.subject}>{item.subject}</Text>
//         <Text style={styles.time}>
//           {item.day} • {item.time}
//         </Text>
//       </View>

//       <View
//         style={[
//           styles.status,
//           item.status === "PRESENT" ? styles.present : styles.absent,
//         ]}
//       >
//         <Text
//           style={{
//             color: item.status === "PRESENT" ? "green" : "red",
//           }}
//         >
//           {item.status}
//         </Text>
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       {/* Attendance Card */}

//       {activeSession && (
//         <View style={styles.card}>
//           <View style={styles.sessionHeader}>
//             <Text style={styles.live}>ATTENDANCE IN PROGRESS</Text>

//             <Text>
//               {activeSession.lectureStart} - {activeSession.lectureEnd}
//             </Text>
//           </View>

//           <Text style={styles.title}>{activeSession.subject.subjectName}</Text>

//           <Text style={styles.teacher}>
//             Prof. {activeSession.teacher.firstName}
//           </Text>

//           {isInRange ? (
//             <TouchableOpacity style={styles.markBtn} onPress={markAttendance}>
//               <Text style={styles.btnText}>Mark Present</Text>
//             </TouchableOpacity>
//           ) : (
//             <Text style={styles.rangeText}>
//               Move closer to classroom to mark attendance
//             </Text>
//           )}
//         </View>
//       )}

//       {/* Attendance History */}

//       <Text style={styles.sectionTitle}>Attendance History</Text>

//       <FlatList
//         data={history}
//         renderItem={renderHistory}
//         keyExtractor={(item) => item.id}
//       />

//       {/* Monthly Summary */}

//       <View style={styles.summaryCard}>
//         <Text style={styles.sectionTitle}>Monthly Summary</Text>

//         <View style={styles.summaryRow}>
//           <View>
//             <Text style={styles.summaryLabel}>TOTAL</Text>
//             <Text style={styles.summaryValue}>{summary.total}</Text>
//           </View>

//           <View>
//             <Text style={styles.summaryLabel}>ATTENDED</Text>
//             <Text style={styles.summaryValue}>{summary.attended}</Text>
//           </View>

//           <View>
//             <Text style={styles.summaryLabel}>RATE</Text>
//             <Text style={styles.summaryRate}>{summary.rate}%</Text>
//           </View>
//         </View>

//         <View style={styles.progressBar}>
//           <View style={[styles.progress, { width: `${summary.rate}%` }]} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#F5F6FA",
//   },

//   card: {
//     backgroundColor: "white",
//     padding: 20,
//     borderRadius: 12,
//     marginBottom: 20,
//     elevation: 3,
//   },

//   sessionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },

//   live: {
//     color: "#2563EB",
//     fontWeight: "bold",
//   },

//   title: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 6,
//   },

//   teacher: {
//     color: "#555",
//     marginBottom: 15,
//   },

//   markBtn: {
//     backgroundColor: "#2563EB",
//     padding: 14,
//     borderRadius: 10,
//     alignItems: "center",
//   },

//   btnText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },

//   rangeText: {
//     color: "red",
//     textAlign: "center",
//   },

//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginVertical: 10,
//   },

//   historyCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "white",
//     padding: 14,
//     borderRadius: 10,
//     marginBottom: 10,
//   },

//   dateBox: {
//     backgroundColor: "#EEF2FF",
//     padding: 10,
//     borderRadius: 8,
//     alignItems: "center",
//     marginRight: 10,
//   },

//   month: {
//     fontSize: 12,
//   },

//   date: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },

//   subject: {
//     fontWeight: "bold",
//   },

//   time: {
//     color: "#666",
//   },

//   status: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 10,
//   },

//   present: {
//     backgroundColor: "#DCFCE7",
//   },

//   absent: {
//     backgroundColor: "#FEE2E2",
//   },

//   summaryCard: {
//     backgroundColor: "white",
//     padding: 20,
//     borderRadius: 12,
//     marginTop: 20,
//   },

//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginVertical: 10,
//   },

//   summaryLabel: {
//     color: "#888",
//   },

//   summaryValue: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },

//   summaryRate: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#2563EB",
//   },

//   progressBar: {
//     height: 8,
//     backgroundColor: "#E5E7EB",
//     borderRadius: 10,
//     marginTop: 10,
//   },

//   progress: {
//     height: 8,
//     backgroundColor: "#2563EB",
//     borderRadius: 10,
//   },
// });

/**
 * StudentAttendanceScreen.jsx
 *
 * Sections:
 *   1. Mark Attendance Card  — shown only when a session is active
 *        • In-range  → enabled "Mark Present" button
 *        • Out-of-range → card shown but disabled with a proximity hint
 *        • No session → section hidden entirely
 *        • Practical sessions → student only sees card for their own batch/section
 *
 *   2. Attendance History    — filterable table (Subject × Month)
 *
 *   3. Attendance Summary    — per-subject stats, synced with Subject filter
 *
 * API endpoints consumed:
 *   GET  /attendance/active                          → active session(s) for student's dept/sem
 *   POST /attendance/mark                            → { sessionId, studentId, bluetoothToken, deviceId }
 *   GET  /attendance/student-history?subjectId=&month= → { history[], summary{} }
 *   GET  /subjects/student/:studentId               → [{ _id, subjectName, ... }]
 *
 * Bluetooth / device note:
 *   Replace the simulated `checkBluetooth()` with your actual BLE scanning logic
 *   (e.g. react-native-ble-plx). The token comparison happens there.
 *   deviceId should be a hashed device fingerprint (e.g. from react-native-device-info).
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

// ─────────────────────────────────────────────
// PALETTE  (consistent with TeacherAttendanceScreen)
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
  warnBg: "#FFF3E0",
  text: "#1A1A2E",
  muted: "#6C757D",
  border: "#DDE3F0",
  live: "#E63946",
  disabled: "#B0BAC9",
};

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

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const pct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

const Divider = () => <View style={s.divider} />;

const SectionHeading = ({ title, sub }) => (
  <View style={s.headingWrap}>
    <Text style={s.headingText}>{title}</Text>
    {sub ? <Text style={s.headingSub}>{sub}</Text> : null}
  </View>
);

const ProgressBar = ({ value }) => {
  const color = value >= 75 ? C.success : value >= 50 ? C.warn : C.danger;
  return (
    <View style={s.progressTrack}>
      <View
        style={[
          s.progressFill,
          { width: `${Math.min(value, 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
};

const Badge = ({ label }) => {
  const isPresent = label === "PRESENT";
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: isPresent ? C.successBg : C.dangerBg },
      ]}
    >
      <Text style={[s.badgeText, { color: isPresent ? C.success : C.danger }]}>
        {label}
      </Text>
    </View>
  );
};

const StatTile = ({ label, value, accent }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, accent && { color: C.accent }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────
// MARK ATTENDANCE CARD
// ─────────────────────────────────────────────
const MarkAttendanceCard = ({ session, isInRange, onMark, marking }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Pulse the live dot
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const isPractical = session.sessionType === "Practical";

  return (
    <Animated.View
      style={[
        s.markCard,
        { opacity: fadeAnim },
        !isInRange && s.markCardDisabled,
      ]}
    >
      {/* Header row */}
      <View style={s.markCardHeader}>
        <View style={s.liveChip}>
          <Animated.View
            style={[s.liveDot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={s.liveText}>LIVE</Text>
        </View>
        <Text style={s.markCardTime}>
          {formatTime(session.lectureStart)} – {formatTime(session.lectureEnd)}
        </Text>
      </View>

      {/* Subject + Teacher */}
      <Text style={s.markCardSubject}>{session.subject?.subjectName}</Text>
      <Text style={s.markCardTeacher}>
        Prof. {session.teacher?.firstName} {session.teacher?.lastName}
      </Text>

      {/* Session type & section pill */}
      <View style={s.sessionMetaRow}>
        <View style={s.sessionTypePill}>
          <Text style={s.sessionTypePillText}>{session.sessionType}</Text>
        </View>
        {isPractical && session.section && (
          <View
            style={[
              s.sessionTypePill,
              { backgroundColor: "#EEF2FF", marginLeft: 6 },
            ]}
          >
            <Text style={[s.sessionTypePillText, { color: C.accent }]}>
              Batch {session.section}
            </Text>
          </View>
        )}
      </View>

      {/* Topic */}
      {!!session.topic && (
        <Text style={s.markCardTopic}>📖 {session.topic}</Text>
      )}

      <Divider />

      {/* CTA */}
      {isInRange ? (
        <TouchableOpacity
          style={[s.markBtn, marking && s.markBtnLoading]}
          onPress={onMark}
          disabled={marking}
          activeOpacity={0.85}
        >
          {marking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.markBtnText}>✓ Mark Present</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={s.outOfRangeBox}>
          <Text style={s.outOfRangeIcon}>📡</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.outOfRangeTitle}>Out of Bluetooth Range</Text>
            <Text style={s.outOfRangeSub}>
              Move closer to the classroom to mark your attendance.
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function StudentAttendanceScreen() {
  const { user } = useAuth();

  // ── Active session ────────────────────────
  const [activeSession, setActiveSession] = useState(null);
  const [isInRange, setIsInRange] = useState(false);
  const [marking, setMarking] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  // ── Subjects & filters ────────────────────
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState(null); // full subject object
  const [filterMonth, setFilterMonth] = useState("overall");

  // ── History ───────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Summary ───────────────────────────────
  const [summary, setSummary] = useState({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    rate: 0,
  });

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchSubjects();
      checkActiveSession();
    }
  }, [user]);

  // Re-fetch history when filters change
  useEffect(() => {
    if (filterSubject) fetchHistory();
  }, [filterSubject, filterMonth]);

  // ─────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────
  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects/student/${user._id}`);
      setSubjects(res.data);
      if (res.data.length > 0) setFilterSubject(res.data[0]);
    } catch (e) {
      console.log("fetchSubjects:", e);
    }
  };

  /**
   * Checks for an active session matching this student's dept/sem.
   * For Practical sessions, the backend should already filter by the
   * student's section so only the relevant batch gets the session.
   *
   * Also runs a simulated Bluetooth check — replace with real BLE scan.
   */
  const checkActiveSession = async () => {
    try {
      const res = await api.get("/attendance/active");
      const sessions = res.data;

      if (!sessions || sessions.length === 0) {
        setActiveSession(null);
        return;
      }

      // For Practical: filter by student's section
      // The backend ideally does this, but guard on frontend too.
      const relevant = sessions.find((sess) => {
        if (sess.sessionType === "Practical") {
          return sess.section === user.section; // user.section = "A" | "B" | "C" | "D"
        }
        return true; // Lecture/Extra Class → all students
      });

      setActiveSession(relevant || null);

      if (relevant) {
        // ── REPLACE THIS with actual BLE scan ──────────────────────────
        // e.g. scan for the teacher's device broadcasting `relevant.bluetoothToken`
        // const found = await scanBluetooth(relevant.bluetoothToken);
        // setIsInRange(found);
        // ──────────────────────────────────────────────────────────────
        setIsInRange(true); // simulated: always in range for now
      }
    } catch (e) {
      console.log("checkActiveSession:", e);
    }
  };

  const handleMarkAttendance = async () => {
    if (!activeSession || !isInRange) return;
    setMarking(true);
    try {
      await api.post("/attendance/mark", {
        sessionId: activeSession._id,
        studentId: user._id,
        bluetoothToken: activeSession.bluetoothToken,
        deviceId: user.deviceId, // hashed device fingerprint from app init
      });
      setAlreadyMarked(true);
      Alert.alert(
        "Attendance Marked ✓",
        "You have been marked present for this session.",
      );
      fetchHistory();
    } catch (e) {
      const msg = e.response?.data?.message || "Could not mark attendance.";
      Alert.alert("Error", msg);
    } finally {
      setMarking(false);
    }
  };

  /**
   * GET /attendance/student-history?subjectId=&month=
   * Returns:
   *   history : [{ _id, date, dayLabel, time, subjectName, sessionType, status }]
   *   summary : { totalClasses, attended, absent, rate }
   */
  const fetchHistory = useCallback(async () => {
    if (!filterSubject) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: filterSubject._id });
      if (filterMonth !== "overall") params.append("month", filterMonth);

      const res = await api.get(`/attendance/student-history?${params}`);
      setHistory(res.data.history || []);
      setSummary(
        res.data.summary || {
          totalClasses: 0,
          attended: 0,
          absent: 0,
          rate: 0,
        },
      );
    } catch (e) {
      console.log("fetchHistory:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [filterSubject, filterMonth]);

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────
  const renderHistoryRow = ({ item, index }) => (
    <View style={[s.tableRow, index % 2 === 0 && s.tableRowAlt]}>
      <View style={s.dateBox}>
        <Text style={s.dateMonth}>{item.monthLabel}</Text>
        <Text style={s.dateDay}>{item.dayNum}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowSubject} numberOfLines={1}>
          {item.subjectName}
        </Text>
        <Text style={s.rowMeta}>
          {item.dayLabel} • {item.time} • {item.sessionType}
        </Text>
      </View>
      <Badge label={item.status} />
    </View>
  );

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* PAGE HEADER */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>My Attendance</Text>
          <Text style={s.pageSub}>Track your presence across all subjects</Text>
        </View>
      </View>

      {/* ══════════════════════════════════════
          SECTION 1 — MARK ATTENDANCE
      ══════════════════════════════════════ */}
      {activeSession && !alreadyMarked && (
        <MarkAttendanceCard
          session={activeSession}
          isInRange={isInRange}
          onMark={handleMarkAttendance}
          marking={marking}
        />
      )}

      {activeSession && alreadyMarked && (
        <View style={s.alreadyMarkedCard}>
          <Text style={s.alreadyMarkedIcon}>✅</Text>
          <View>
            <Text style={s.alreadyMarkedTitle}>Attendance Marked</Text>
            <Text style={s.alreadyMarkedSub}>
              You're marked present for this session.
            </Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════
          SECTION 2 — HISTORY
      ══════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeading
          title="Attendance History"
          sub="Your session-by-session record"
        />

        {/* Filters */}
        <View style={s.filterRow}>
          <View style={s.filterItem}>
            <Text style={s.filterLabel}>Subject</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={filterSubject?._id}
                onValueChange={(val) => {
                  const subj = subjects.find((s) => s._id === val);
                  if (subj) setFilterSubject(subj);
                }}
                style={s.picker}
              >
                {subjects.map((subj) => (
                  <Picker.Item
                    key={subj._id}
                    label={subj.subjectName}
                    value={subj._id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[s.filterItem, { marginLeft: 10 }]}>
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
        </View>

        <Divider />

        {/* Table header */}
        <View style={s.tableHeader}>
          <View style={s.dateBoxPlaceholder} />
          <Text style={[s.tableHeadCell, { flex: 1 }]}>Subject & Details</Text>
          <Text style={s.tableHeadCell}>Status</Text>
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
          SECTION 3 — SUMMARY
      ══════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeading
          title="Attendance Summary"
          sub={filterSubject?.subjectName ?? "Select a subject"}
        />

        {/* Stat tiles */}
        <View style={s.statsRow}>
          <StatTile label="Total" value={summary.totalClasses} />
          <StatTile label="Attended" value={summary.attended} accent />
          <StatTile label="Absent" value={summary.absent} />
          <StatTile
            label="Rate"
            value={`${summary.rate ?? pct(summary.attended, summary.totalClasses)}%`}
            accent
          />
        </View>

        <Divider />

        {/* Rate bar */}
        <View style={s.rateRow}>
          <Text style={s.rateLabel}>Overall Rate</Text>
          <Text
            style={[
              s.rateValue,
              { color: (summary.rate ?? 0) >= 75 ? C.success : C.danger },
            ]}
          >
            {summary.rate ?? pct(summary.attended, summary.totalClasses)}%
          </Text>
        </View>
        <ProgressBar
          value={summary.rate ?? pct(summary.attended, summary.totalClasses)}
        />

        {/* Warning if below threshold */}
        {(summary.rate ?? pct(summary.attended, summary.totalClasses)) < 75 && (
          <View style={s.warnBanner}>
            <Text style={s.warnText}>
              ⚠ Your attendance is below 75%. You may be barred from exams if
              this continues.
            </Text>
          </View>
        )}

        {/* How many more classes needed */}
        {(() => {
          const rate =
            summary.rate ?? pct(summary.attended, summary.totalClasses);
          if (rate >= 75 || summary.totalClasses === 0) return null;
          // Solve: (attended + x) / (total + x) >= 0.75
          const x = Math.ceil(
            (0.75 * summary.totalClasses - summary.attended) / (1 - 0.75),
          );
          return (
            <Text style={s.recoverText}>
              Attend the next {x} consecutive class{x > 1 ? "es" : ""} to reach
              75%.
            </Text>
          );
        })()}
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

  // ── Mark Attendance Card ─────────────────
  markCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.live,
    shadowColor: C.live,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  markCardDisabled: {
    borderLeftColor: C.disabled,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  markCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.live,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.live,
    letterSpacing: 1,
  },
  markCardTime: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "500",
  },
  markCardSubject: {
    fontSize: 20,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  markCardTeacher: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 10,
  },
  sessionMetaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  sessionTypePill: {
    backgroundColor: "#FEF3E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionTypePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.warn,
    letterSpacing: 0.3,
  },
  markCardTopic: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 4,
  },
  markBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  markBtnLoading: {
    opacity: 0.7,
  },
  markBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  outOfRangeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  outOfRangeIcon: {
    fontSize: 22,
  },
  outOfRangeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },
  outOfRangeSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },

  // ── Already Marked ────────────────────────
  alreadyMarkedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.successBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#B7E4C7",
  },
  alreadyMarkedIcon: {
    fontSize: 28,
  },
  alreadyMarkedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.success,
  },
  alreadyMarkedSub: {
    fontSize: 12,
    color: C.success,
    opacity: 0.8,
    marginTop: 2,
  },

  // ── Card ─────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // ── Section Heading ───────────────────────
  headingWrap: { marginBottom: 16 },
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

  // ── Filters ───────────────────────────────
  filterRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  filterItem: { flex: 1 },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 5,
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

  // ── Table ─────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    marginBottom: 2,
  },
  tableHeadCell: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accent,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dateBoxPlaceholder: {
    width: 46,
    marginRight: 12,
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
    borderRadius: 6,
  },
  dateBox: {
    width: 46,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 10,
    color: C.accent,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: C.primary,
    lineHeight: 22,
  },
  rowSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  rowMeta: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  emptyText: {
    textAlign: "center",
    color: C.muted,
    fontSize: 13,
    paddingVertical: 24,
  },

  // ── Summary ───────────────────────────────
  statsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
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
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 99,
  },
  warnBanner: {
    backgroundColor: C.warnBg,
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
    lineHeight: 17,
  },
  recoverText: {
    fontSize: 12,
    color: C.accent,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
});
