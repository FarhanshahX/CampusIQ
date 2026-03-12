import React, { useEffect, useState, useMemo, use } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={styles.sectionDivider} />
  </View>
);

const ScoreInput = ({ label, value, onChangeText, highlight }) => (
  <View style={styles.scoreCell}>
    <Text style={styles.scoreLabel}>{label}</Text>
    <TextInput
      style={[styles.scoreInput, highlight && styles.scoreInputHighlight]}
      keyboardType="numeric"
      value={value}
      onChangeText={onChangeText}
      placeholder="—"
      placeholderTextColor="#C4C9D4"
    />
  </View>
);

const ResultPill = ({ label, value, max }) => (
  <View style={styles.resultPill}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={styles.resultValue}>
      {value} <Text style={styles.resultMax}>/ {max}</Text>
    </Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ScoresEnteringScreen() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [saving, setSaving] = useState(false);
  const [scoresFetching, setScoresFetching] = useState(false);
  const [attendanceFetching, setAttendanceFetching] = useState(false);
  const [isMarksLocked, setIsMarksLocked] = useState(false);
  const [lockToggling, setLockToggling] = useState(false);

  const [internal, setInternal] = useState(Array(6).fill(""));
  const [experiments, setExperiments] = useState(Array(10).fill(""));
  const [assignments, setAssignments] = useState(Array(2).fill(""));
  const [attendance, setAttendance] = useState("");
  const [practical, setPractical] = useState("");
  const [theory, setTheory] = useState("");

  const userId = useAuth().user?._id;
  const SUBJECT_NAME = "Database Management Systems";

  // Fetch students list on mount
  useEffect(() => {
    fetchTeacherSubjects(userId);
    api.get("/admin/students").then((res) => {
      console.log("Fetched students:", res.data);
      setStudents(res.data);
    });
    fetchMarkLockStatus();
  }, []);

  const fetchTeacherSubjects = async (teacherId) => {
    try {
      const res = await api.get(`/subjects/teacher/${teacherId}`);
      const subjects = res.data[0] || [];
      setSubjects(subjects);
      if (!subjects.includes(SUBJECT_NAME)) {
        alert(
          `You are not assigned to teach ${SUBJECT_NAME}. Please contact admin.`,
        );
      }
    } catch (e) {
      alert("Failed to verify subject assignment. Please try again.");
    }
  };

  const fetchMarkLockStatus = async () => {
    try {
      const res = await api.get("/scores/lock/status");
      setIsMarksLocked(res.data?.isLocked || false);
    } catch (_) {
      setIsMarksLocked(false);
    }
  };

  // When student changes: reset fields -> fetch saved scores -> fetch live attendance
  useEffect(() => {
    if (!selectedStudent) {
      resetFields();
      return;
    }
    resetFields();
    fetchStudentScores(selectedStudent);
    fetchAttendanceScore(selectedStudent);
  }, [selectedStudent]);

  const resetFields = () => {
    setInternal(Array(6).fill(""));
    setExperiments(Array(10).fill(""));
    setAssignments(Array(2).fill(""));
    setAttendance("");
    setPractical("");
    setTheory("");
  };

  /**
   * Fetch previously saved marks for this student + subject.
   * Expected response shape: { marks: { internalTests[], experiments[],
   *   assignments[], practicalOral, theory, attendanceScore } }
   */
  const fetchStudentScores = async (studentId) => {
    setScoresFetching(true);
    try {
      const res = await api.get(`/scores/${studentId}/${subjects._id}`);
      const marks = res.data?.marks;
      console.log(marks);
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
              marks.experiments[i] != null ? String(marks.experiments[i]) : "",
            ),
        );
      }
      if (marks.assignments) {
        setAssignments(
          Array(2)
            .fill("")
            .map((_, i) =>
              marks.assignments[i] != null ? String(marks.assignments[i]) : "",
            ),
        );
      }
      if (marks.practicalOral != null) {
        setPractical(String(marks.practicalOral));
      }
      if (marks.theory != null) {
        setTheory(String(marks.theory));
      }
      // Pre-fill attendance from saved value as fallback (live fetch may override below)
      if (marks.attendanceScore != null)
        setAttendance(String(marks.attendanceScore));
    } catch (_) {
      // No saved scores yet — fields stay empty for fresh entry
    } finally {
      setScoresFetching(false);
    }
  };

  /**
   * Fetch live-computed attendance score.
   * Expected response: { attendanceScore: number }
   * This overrides the saved value so it always reflects current attendance.
   */
  const fetchAttendanceScore = async (studentId) => {
    setAttendanceFetching(true);
    try {
      const res = await api.get(
        `/attendance/score/${studentId}/${encodeURIComponent(SUBJECT_NAME)}`,
      );
      if (res.data?.attendanceScore != null)
        setAttendance(String(res.data.attendanceScore));
    } catch (_) {
      // Keep whatever the saved marks provided
    } finally {
      setAttendanceFetching(false);
    }
  };

  // ── Live calculations ────────────────────────────────────────────────────

  const internalTotal = useMemo(() => {
    const sum = internal.map(Number).reduce((a, b) => a + b, 0);
    return ((sum / 60) * 20).toFixed(2);
  }, [internal]);

  const experimentTotal = useMemo(() => {
    const avg = experiments.map(Number).reduce((a, b) => a + b, 0) / 10;
    return avg.toFixed(2);
  }, [experiments]);

  const assignmentTotal = useMemo(() => {
    const avg = assignments.map(Number).reduce((a, b) => a + b, 0) / 2;
    return avg.toFixed(2);
  }, [assignments]);

  const grandTotal = useMemo(
    () =>
      (
        Number(internalTotal) +
        Number(experimentTotal) +
        Number(assignmentTotal) +
        Number(attendance) +
        Number(practical) +
        Number(theory)
      ).toFixed(2),
    [
      internalTotal,
      experimentTotal,
      assignmentTotal,
      attendance,
      practical,
      theory,
    ],
  );

  // ── Save ─────────────────────────────────────────────────────────────────

  const saveMarks = async () => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/scores/update", {
        studentId: selectedStudent,
        subjectName: SUBJECT_NAME,
        marks: {
          internalTests: internal.map(Number),
          experiments: experiments.map(Number),
          assignments: assignments.map(Number),
          // attendanceScore: Number(attendance),
          practicalOral: Number(practical),
          theory: Number(theory),
          internalTotal: Number(internalTotal),
          experimentTotal: Number(experimentTotal),
          assignmentTotal: Number(assignmentTotal),
          totalMarks: Number(grandTotal),
        },
      });
      alert("Marks saved successfully.");
    } catch (_) {
      alert("Failed to save marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    setLockToggling(true);
    try {
      await api.post("/scores/lock", {
        isLocked: !isMarksLocked,
      });
      setIsMarksLocked(!isMarksLocked);
      alert(
        isMarksLocked
          ? "Marks unlocked for all students"
          : "Marks locked for all students",
      );
    } catch (_) {
      alert("Failed to toggle marks lock. Please try again.");
    } finally {
      setLockToggling(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderGrid = (data, setData, label) => (
    <View style={styles.grid}>
      {data.map((val, i) => (
        <ScoreInput
          key={i}
          label={`${label} ${i + 1}`}
          value={val}
          onChangeText={(text) => {
            const arr = [...data];
            arr[i] = text;
            setData(arr);
          }}
        />
      ))}
    </View>
  );

  // Dim score sections while data is loading
  const isBusy = scoresFetching || attendanceFetching;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTag}>MARKS ENTRY</Text>
        <Text style={styles.pageTitle}>{subjects.subjectName}</Text>
      </View>

      {/* ── Student Selector ── */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>STUDENT</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedStudent}
            onValueChange={(value) => setSelectedStudent(value)}
            style={styles.picker}
          >
            <Picker.Item label="Select a student..." value="" />
            {students.map((s) => (
              <Picker.Item
                key={s._id}
                label={`${s.registrationNumber}  ·  ${s.firstName}`}
                value={s._id}
              />
            ))}
          </Picker>
        </View>

        {/* Loading banner */}
        {scoresFetching && (
          <View style={styles.banner}>
            <ActivityIndicator size="small" color="#3B5BDB" />
            <Text style={styles.bannerText}>Loading saved scores…</Text>
          </View>
        )}

        {/* Success banner — shown once data is loaded */}
        {!scoresFetching && selectedStudent !== "" && (
          <View style={[styles.banner, styles.bannerSuccess]}>
            <Text style={styles.bannerSuccessText}>
              ✓ Scores loaded — edit any field and tap Save All to update
            </Text>
          </View>
        )}
      </View>

      {/* ── Internal Tests ── */}
      <View style={[styles.card, isBusy && styles.cardDimmed]}>
        <SectionHeader title="Internal Tests" subtitle="Each test out of 10" />
        {renderGrid(internal, setInternal, "Test")}
        <ResultPill label="Converted Score" value={internalTotal} max="20" />
      </View>

      {/* ── Experiments ── */}
      <View style={[styles.card, isBusy && styles.cardDimmed]}>
        <SectionHeader title="Experiments" subtitle="Each out of 15" />
        {renderGrid(experiments, setExperiments, "Exp")}
        <ResultPill label="Average Score" value={experimentTotal} max="15" />
      </View>

      {/* ── Assignments ── */}
      <View style={[styles.card, isBusy && styles.cardDimmed]}>
        <SectionHeader title="Assignments" subtitle="Each out of 5" />
        {renderGrid(assignments, setAssignments, "Assignment")}
        <ResultPill label="Average Score" value={assignmentTotal} max="5" />
      </View>

      {/* ── Attendance ── */}
      <View style={[styles.card, isBusy && styles.cardDimmed]}>
        <SectionHeader
          title="Attendance"
          subtitle="Auto-calculated · Editable"
        />
        {attendanceFetching ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color="#3B5BDB" />
            <Text style={styles.inlineLoaderText}>Fetching attendance…</Text>
          </View>
        ) : (
          <View style={styles.singleInputRow}>
            <ScoreInput
              label="Score"
              value={attendance}
              onChangeText={setAttendance}
              highlight
            />
            <Text style={styles.attendanceNote}>
              Auto-filled from attendance records.{"\n"}You may override if
              needed.
            </Text>
          </View>
        )}
        <ResultPill
          label="Attendance Score"
          value={attendance || "0"}
          max="5"
        />
      </View>

      {/* ── Practical / Oral ── */}
      <View style={[styles.card, isBusy && styles.cardDimmed]}>
        <SectionHeader title="Practical / Oral" subtitle="Out of 25" />
        <View style={styles.grid}>
          <ScoreInput
            label="Marks"
            value={practical}
            onChangeText={setPractical}
          />
        </View>
        <ResultPill label="Practical & Orals" value={practical} max="25" />
      </View>

      {/* ── Theory Exam ── */}
      <View style={[styles.card, isBusy && styles.cardDimmed]}>
        <SectionHeader title="Theory Exam" subtitle="Out of 80" />
        <View style={styles.grid}>
          <ScoreInput label="Marks" value={theory} onChangeText={setTheory} />
        </View>
        <ResultPill label="Theory Examination" value={theory} max="80" />
      </View>

      {/* ── Grand Total ── */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL MARKS</Text>
        <Text style={styles.totalValue}>{grandTotal}</Text>
        <Text style={styles.totalMax}>out of 150</Text>
      </View>

      {/* ── Actions ── */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveMarks}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save All</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.lockBtn, lockToggling && styles.lockBtnDisabled]}
        onPress={handleLock}
        disabled={lockToggling}
        activeOpacity={0.85}
      >
        <Text style={styles.lockBtnText}>
          {lockToggling ? "..." : isMarksLocked ? "Unlock Marks" : "Lock Marks"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 20 },

  // Page Header
  pageHeader: { marginBottom: 24, marginTop: 8 },
  pageTag: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#3B5BDB",
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.4,
    lineHeight: 28,
  },

  // Cards
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
  cardDimmed: { opacity: 0.45 },

  // Section Header
  sectionHeader: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 8,
  },
  sectionDivider: { height: 1, backgroundColor: "#F3F4F6", marginTop: 4 },

  // Student picker
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

  // Status banners inside student card
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

  // Score Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  scoreCell: { alignItems: "center", minWidth: 84 },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#9CA3AF",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#FAFAFA",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    width: 68,
  },
  scoreInputHighlight: {
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
  },

  // Result Pill
  resultPill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  resultLabel: { fontSize: 12, fontWeight: "600", color: "#3B5BDB" },
  resultValue: { fontSize: 15, fontWeight: "700", color: "#1D4ED8" },
  resultMax: { fontSize: 13, fontWeight: "400", color: "#93C5FD" },

  // Inline loader
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  inlineLoaderText: { fontSize: 13, color: "#9CA3AF" },

  // Attendance single-input row
  singleInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  attendanceNote: { flex: 1, fontSize: 12, color: "#9CA3AF", lineHeight: 18 },

  // Total Card
  totalCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#6B7280",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  totalMax: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  // Buttons
  saveBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  lockBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  lockBtnDisabled: { opacity: 0.6 },
  lockBtnText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

// import React, { useEffect, useState, useMemo } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import api from "../../api/axios";

// const SUBJECT_NAME = "Database Management Systems";

// const SectionHeader = ({ title, subtitle }) => (
//   <View style={styles.sectionHeader}>
//     <Text style={styles.sectionTitle}>{title}</Text>
//     {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
//     <View style={styles.sectionDivider} />
//   </View>
// );

// const ScoreInput = ({ label, value, onChangeText }) => (
//   <View style={styles.scoreCell}>
//     <Text style={styles.scoreLabel}>{label}</Text>
//     <TextInput
//       style={styles.scoreInput}
//       keyboardType="numeric"
//       value={value}
//       onChangeText={onChangeText}
//       placeholder="—"
//       placeholderTextColor="#C4C9D4"
//     />
//   </View>
// );

// const ResultPill = ({ label, value, max }) => (
//   <View style={styles.resultPill}>
//     <Text style={styles.resultLabel}>{label}</Text>
//     <Text style={styles.resultValue}>
//       {value} <Text style={styles.resultMax}>/ {max}</Text>
//     </Text>
//   </View>
// );

// export default function ScoresEnteringScreen() {
//   const [students, setStudents] = useState([]);
//   const [selectedStudent, setSelectedStudent] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [attendanceFetching, setAttendanceFetching] = useState(false);

//   const [internal, setInternal] = useState(Array(6).fill(""));
//   const [experiments, setExperiments] = useState(Array(10).fill(""));
//   const [assignments, setAssignments] = useState(Array(2).fill(""));
//   const [attendance, setAttendance] = useState("");
//   const [practical, setPractical] = useState("");
//   const [theory, setTheory] = useState("");

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   // Fetch attendance when student changes
//   useEffect(() => {
//     if (selectedStudent) {
//       fetchAttendanceScore(selectedStudent);
//     } else {
//       setAttendance("");
//     }
//   }, [selectedStudent]);

//   const fetchStudents = async () => {
//     const res = await api.get("/admin/students");
//     setStudents(res.data);
//   };

//   const fetchAttendanceScore = async (studentId) => {
//     setAttendanceFetching(true);
//     try {
//       const res = await api.get(
//         `/attendance/score/${studentId}/${encodeURIComponent(SUBJECT_NAME)}`,
//       );
//       // Expects res.data.attendanceScore (0–5)
//       setAttendance(String(res.data.attendanceScore ?? ""));
//     } catch (e) {
//       setAttendance("");
//     } finally {
//       setAttendanceFetching(false);
//     }
//   };

//   // LIVE CALCULATIONS
//   const internalTotal = useMemo(() => {
//     const sum = internal.map(Number).reduce((a, b) => a + b, 0);
//     return ((sum / 60) * 20).toFixed(2);
//   }, [internal]);

//   const experimentTotal = useMemo(() => {
//     const avg = experiments.map(Number).reduce((a, b) => a + b, 0) / 10;
//     return avg.toFixed(2);
//   }, [experiments]);

//   const assignmentTotal = useMemo(() => {
//     const avg = assignments.map(Number).reduce((a, b) => a + b, 0) / 2;
//     return avg.toFixed(2);
//   }, [assignments]);

//   const grandTotal = useMemo(() => {
//     return (
//       Number(internalTotal) +
//       Number(experimentTotal) +
//       Number(assignmentTotal) +
//       Number(attendance) +
//       Number(practical) +
//       Number(theory)
//     ).toFixed(2);
//   }, [
//     internalTotal,
//     experimentTotal,
//     assignmentTotal,
//     attendance,
//     practical,
//     theory,
//   ]);

//   const saveMarks = async () => {
//     if (!selectedStudent) {
//       alert("Please select a student first.");
//       return;
//     }
//     setLoading(true);
//     try {
//       await api.post("/scores/update", {
//         studentId: selectedStudent,
//         subjectName: SUBJECT_NAME,
//         marks: {
//           internalTests: internal.map(Number),
//           experiments: experiments.map(Number),
//           assignments: assignments.map(Number),
//           attendanceScore: Number(attendance),
//           practicalOral: Number(practical),
//           theory: Number(theory),
//           internalTotal: Number(internalTotal),
//           experimentTotal: Number(experimentTotal),
//           assignmentTotal: Number(assignmentTotal),
//           totalMarks: Number(grandTotal),
//         },
//       });
//       alert("Marks saved successfully.");
//     } catch (e) {
//       alert("Failed to save marks. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLock = async () => {
//     if (!selectedStudent) {
//       alert("Please select a student first.");
//       return;
//     }
//     await api.post("/scores/lock", {
//       studentId: selectedStudent,
//       subjectName: SUBJECT_NAME,
//     });
//     alert("Marks Locked");
//   };

//   const renderGrid = (data, setData, columns, label) => (
//     <View style={styles.grid}>
//       {data.map((val, i) => (
//         <ScoreInput
//           key={i}
//           label={`${label} ${i + 1}`}
//           value={val}
//           onChangeText={(text) => {
//             const arr = [...data];
//             arr[i] = text;
//             setData(arr);
//           }}
//         />
//       ))}
//     </View>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.content}
//       showsVerticalScrollIndicator={false}
//     >
//       {/* Header */}
//       <View style={styles.pageHeader}>
//         <Text style={styles.pageTag}>MARKS ENTRY</Text>
//         <Text style={styles.pageTitle}>{SUBJECT_NAME}</Text>
//       </View>

//       {/* Student Selector */}
//       <View style={styles.card}>
//         <Text style={styles.fieldLabel}>STUDENT</Text>
//         <View style={styles.pickerWrapper}>
//           <Picker
//             selectedValue={selectedStudent}
//             onValueChange={(value) => setSelectedStudent(value)}
//             style={styles.picker}
//           >
//             <Picker.Item label="Select a student..." value="" />
//             {students.map((s) => (
//               <Picker.Item
//                 key={s._id}
//                 label={`${s.registrationNumber}  ·  ${s.firstName}`}
//                 value={s._id}
//               />
//             ))}
//           </Picker>
//         </View>
//       </View>

//       {/* Internal Tests */}
//       <View style={styles.card}>
//         <SectionHeader title="Internal Tests" subtitle="Each test out of 10" />
//         {renderGrid(internal, setInternal, 3, "Test")}
//         <ResultPill label="Converted Score" value={internalTotal} max="20" />
//       </View>

//       {/* Experiments */}
//       <View style={styles.card}>
//         <SectionHeader title="Experiments" subtitle="Each out of 15" />
//         {renderGrid(experiments, setExperiments, 5, "Exp")}
//         <ResultPill label="Average Score" value={experimentTotal} max="15" />
//       </View>

//       {/* Assignments */}
//       <View style={styles.card}>
//         <SectionHeader title="Assignments" subtitle="Each out of 5" />
//         {renderGrid(assignments, setAssignments, 2, "Assignment")}
//         <ResultPill label="Average Score" value={assignmentTotal} max="5" />
//       </View>

//       {/* Attendance */}
//       <View style={styles.card}>
//         <SectionHeader
//           title="Attendance"
//           subtitle="Auto-calculated · Editable"
//         />
//         {attendanceFetching ? (
//           <View style={styles.attendanceLoading}>
//             <ActivityIndicator size="small" color="#3B5BDB" />
//             <Text style={styles.attendanceLoadingText}>
//               Fetching attendance…
//             </Text>
//           </View>
//         ) : (
//           <View style={styles.singleInputRow}>
//             <View style={[styles.scoreCell, { width: 120 }]}>
//               <Text style={styles.scoreLabel}>Score</Text>
//               <TextInput
//                 style={[styles.scoreInput, styles.scoreInputHighlight]}
//                 keyboardType="numeric"
//                 value={attendance}
//                 onChangeText={setAttendance}
//                 placeholder="—"
//                 placeholderTextColor="#C4C9D4"
//               />
//             </View>
//             <Text style={styles.attendanceNote}>
//               Auto-filled from attendance records.{"\n"}You may override if
//               needed.
//             </Text>
//           </View>
//         )}
//         <ResultPill
//           label="Attendance Score"
//           value={attendance || "0"}
//           max="5"
//         />
//       </View>

//       {/* Practical / Oral */}
//       <View style={styles.card}>
//         <SectionHeader title="Practical / Oral" subtitle="Out of 25" />
//         <View style={styles.grid}>
//           <ScoreInput
//             label="Marks"
//             value={practical}
//             onChangeText={setPractical}
//           />
//         </View>
//       </View>

//       {/* Theory */}
//       <View style={styles.card}>
//         <SectionHeader title="Theory Exam" subtitle="Out of 80" />
//         <View style={styles.grid}>
//           <ScoreInput label="Marks" value={theory} onChangeText={setTheory} />
//         </View>
//       </View>

//       {/* Grand Total */}
//       <View style={styles.totalCard}>
//         <Text style={styles.totalLabel}>TOTAL MARKS</Text>
//         <Text style={styles.totalValue}>{grandTotal}</Text>
//         <Text style={styles.totalMax}>out of 150</Text>
//       </View>

//       {/* Actions */}
//       <TouchableOpacity
//         style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
//         onPress={saveMarks}
//         disabled={loading}
//         activeOpacity={0.85}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.saveBtnText}>Save All</Text>
//         )}
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.lockBtn}
//         onPress={handleLock}
//         activeOpacity={0.85}
//       >
//         <Text style={styles.lockBtnText}>Lock Marks</Text>
//       </TouchableOpacity>

//       <View style={{ height: 40 }} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F7F8FA",
//   },
//   content: {
//     padding: 20,
//   },

//   // Page Header
//   pageHeader: {
//     marginBottom: 24,
//     marginTop: 8,
//   },
//   pageTag: {
//     fontSize: 11,
//     fontWeight: "700",
//     letterSpacing: 2,
//     color: "#3B5BDB",
//     marginBottom: 6,
//   },
//   pageTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#111827",
//     letterSpacing: -0.4,
//     lineHeight: 28,
//   },

//   // Card
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14,
//     padding: 18,
//     marginBottom: 14,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },

//   // Section Header inside card
//   sectionHeader: {
//     marginBottom: 14,
//   },
//   sectionTitle: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#111827",
//     letterSpacing: -0.2,
//   },
//   sectionSubtitle: {
//     fontSize: 12,
//     color: "#9CA3AF",
//     marginTop: 2,
//     marginBottom: 8,
//   },
//   sectionDivider: {
//     height: 1,
//     backgroundColor: "#F3F4F6",
//     marginTop: 4,
//   },

//   // Student Picker
//   fieldLabel: {
//     fontSize: 11,
//     fontWeight: "700",
//     letterSpacing: 1.5,
//     color: "#9CA3AF",
//     marginBottom: 8,
//   },
//   pickerWrapper: {
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 10,
//     overflow: "hidden",
//     backgroundColor: "#FAFAFA",
//   },
//   picker: {
//     height: 48,
//     color: "#111827",
//   },

//   // Score Grid
//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//     marginBottom: 14,
//   },
//   scoreCell: {
//     alignItems: "center",
//     minWidth: 68,
//   },
//   scoreLabel: {
//     fontSize: 10,
//     fontWeight: "600",
//     letterSpacing: 0.5,
//     color: "#9CA3AF",
//     marginBottom: 5,
//     textTransform: "uppercase",
//   },
//   scoreInput: {
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 8,
//     backgroundColor: "#FAFAFA",
//     textAlign: "center",
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#111827",
//     width: 68,
//   },
//   scoreInputHighlight: {
//     borderColor: "#93C5FD",
//     backgroundColor: "#EFF6FF",
//     color: "#1D4ED8",
//   },

//   // Result Pill
//   resultPill: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#F0F4FF",
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//   },
//   resultLabel: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#3B5BDB",
//   },
//   resultValue: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#1D4ED8",
//   },
//   resultMax: {
//     fontSize: 13,
//     fontWeight: "400",
//     color: "#93C5FD",
//   },

//   // Attendance
//   attendanceLoading: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     marginBottom: 14,
//   },
//   attendanceLoadingText: {
//     fontSize: 13,
//     color: "#9CA3AF",
//   },
//   singleInputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 14,
//     marginBottom: 14,
//   },
//   attendanceNote: {
//     flex: 1,
//     fontSize: 12,
//     color: "#9CA3AF",
//     lineHeight: 18,
//   },

//   // Total Card
//   totalCard: {
//     backgroundColor: "#111827",
//     borderRadius: 14,
//     padding: 22,
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   totalLabel: {
//     fontSize: 11,
//     fontWeight: "700",
//     letterSpacing: 2,
//     color: "#6B7280",
//     marginBottom: 8,
//   },
//   totalValue: {
//     fontSize: 44,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     letterSpacing: -1,
//   },
//   totalMax: {
//     fontSize: 13,
//     color: "#6B7280",
//     marginTop: 4,
//   },

//   // Buttons
//   saveBtn: {
//     backgroundColor: "#3B5BDB",
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   saveBtnDisabled: {
//     opacity: 0.6,
//   },
//   saveBtnText: {
//     color: "#FFFFFF",
//     fontSize: 15,
//     fontWeight: "700",
//     letterSpacing: 0.3,
//   },
//   lockBtn: {
//     backgroundColor: "transparent",
//     borderWidth: 1.5,
//     borderColor: "#DC2626",
//     borderRadius: 12,
//     paddingVertical: 14,
//     alignItems: "center",
//   },
//   lockBtnText: {
//     color: "#DC2626",
//     fontSize: 14,
//     fontWeight: "600",
//     letterSpacing: 0.3,
//   },
// });
