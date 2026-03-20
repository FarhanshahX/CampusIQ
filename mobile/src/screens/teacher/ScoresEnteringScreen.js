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
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import TeacherHeader from "../../components/TeacherHeader";
import { Picker } from "@react-native-picker/picker";

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
  const [currentSubjectType, setCurrentSubjectType] = useState("");

  const { user, activeSubject } = useAuth();
  const userId = user?._id;

  // Fetch students list on mount
  useEffect(() => {
    api.get("/admin/students").then((res) => {
      setStudents(res.data);
    });
    // fetchMarkLockStatus will be called in the next useEffect with activeSubject
  }, []);

  const fetchMarkLockStatus = async (subjectId) => {
    if (!subjectId) return;
    try {
      const res = await api.get(`/scores/lock/status/${subjectId}`);
      setIsMarksLocked(res.data?.isLocked || false);
    } catch (_) {
      setIsMarksLocked(false);
    }
  };

  // When student or active subject changes: reset fields -> fetch saved scores -> fetch live attendance -> fetch updated lock status
  useEffect(() => {
    if (activeSubject) {
      setCurrentSubjectType(activeSubject.subjectType);
    }

    if (!selectedStudent || !activeSubject) {
      resetFields();
      return;
    }
    resetFields();
    fetchStudentScores(selectedStudent, activeSubject._id);
    fetchAttendanceScore(selectedStudent, activeSubject._id);
    fetchMarkLockStatus(activeSubject._id);
  }, [selectedStudent, activeSubject]);

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
  const fetchStudentScores = async (studentId, subjectId) => {
    setScoresFetching(true);
    try {
      const res = await api.get(`/scores/${studentId}/${subjectId}`);
      const marks = res.data?.marks;
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
  const fetchAttendanceScore = async (studentId, subjectId) => {
    setAttendanceFetching(true);
    try {
      const subjectName = activeSubject ? activeSubject.subjectName : "";

      const res = await api.get(
        `/attendance/score/${studentId}/${encodeURIComponent(subjectName)}`,
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
    if (!activeSubject) {
      alert("No active subject selected. Please choose one in your Profile.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/scores/update", {
        studentId: selectedStudent,
        subjectID: activeSubject._id,
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
    if (!activeSubject) {
      alert("No active subject selected. Please choose one in your Profile.");
      return;
    }
    setLockToggling(true);
    try {
      await api.post(`/scores/lock/${activeSubject._id}`, {
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
    <>
      <TeacherHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTag}>MARKS ENTRY</Text>
          {/* <Text style={styles.pageTitle}>Update Student Scores</Text> */}
          {/* {activeSubject && <Text style={{fontSize: 14, color: "#6B7280", marginTop: 4}}>Currently editing: {activeSubject.subjectName} ({activeSubject.subjectCode})</Text>} */}
          {/* <Text style={{fontSize: 14, color: "#6B7280", marginTop: 4}}>Subject:</Text> */}
          {activeSubject && (
            <Text style={styles.pageTitle}>
              {activeSubject.subjectName}
              {"\n"}({activeSubject.subjectCode})
            </Text>
          )}
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
                  label={`${s.registrationNumber}  -  ${s.firstName} ${s.lastName}`}
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
        {currentSubjectType !== "Lab+Practical" && (
          <View style={[styles.card, isBusy && styles.cardDimmed]}>
            <SectionHeader
              title="Internal Tests"
              subtitle="Each test out of 10"
            />
            {renderGrid(internal, setInternal, "Test")}
            <ResultPill
              label="Converted Score"
              value={internalTotal}
              max="20"
            />
          </View>
        )}

        {/* ── Experiments ── */}
        {currentSubjectType !== "Theory" && (
          <View style={[styles.card, isBusy && styles.cardDimmed]}>
            <SectionHeader title="Experiments" subtitle="Each out of 15" />
            {renderGrid(experiments, setExperiments, "Exp")}
            <ResultPill
              label="Average Score"
              value={experimentTotal}
              max="15"
            />
          </View>
        )}

        {/* ── Assignments ── */}
        {currentSubjectType !== "Theory" && (
          <View style={[styles.card, isBusy && styles.cardDimmed]}>
            <SectionHeader title="Assignments" subtitle="Each out of 5" />
            {renderGrid(assignments, setAssignments, "Assignment")}
            <ResultPill label="Average Score" value={assignmentTotal} max="5" />
          </View>
        )}

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
        {currentSubjectType === "Theory+Lab+Practical" && (
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
        )}

        {/* ── Theory Exam ── */}
        {currentSubjectType !== "Lab+Practical" && (
          <View style={[styles.card, isBusy && styles.cardDimmed]}>
            <SectionHeader title="Theory Exam" subtitle="Out of 80" />
            <View style={styles.grid}>
              <ScoreInput
                label="Marks"
                value={theory}
                onChangeText={setTheory}
              />
            </View>
            <ResultPill label="Theory Examination" value={theory} max="80" />
          </View>
        )}

        {/* ── Grand Total ── */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>TOTAL MARKS</Text>
            <Text style={styles.totalNote}>
              {currentSubjectType === "Theory+Lab+Practical"
                ? "Internal + Lab + Practical + Theory"
                : currentSubjectType === "Theory+Lab"
                  ? "Internal + Lab + Theory"
                  : currentSubjectType === "Theory"
                    ? "Internal + Theory"
                    : "Lab + Practical"}
            </Text>
          </View>
          <View>
            <Text style={styles.totalValue}>{grandTotal}</Text>
            <Text style={styles.totalMax}>
              out of{" "}
              {currentSubjectType === "Theory+Lab+Practical"
                ? "150"
                : currentSubjectType === "Theory+Lab"
                  ? "125"
                  : currentSubjectType === "Theory"
                    ? "100"
                    : "50"}
            </Text>
          </View>
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
            {lockToggling
              ? "..."
              : isMarksLocked
                ? "Unlock Marks"
                : "Lock Marks"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
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
  picker: { height: 50, color: "#111827" },

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
    textAlign: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  totalValue: {
    fontSize: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  totalNote: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  totalMax: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },

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
