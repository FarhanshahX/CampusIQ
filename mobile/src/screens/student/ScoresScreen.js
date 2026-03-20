import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={styles.sectionDivider} />
  </View>
);

/**
 * A single score cell.
 * - If `readOnly` is true: rendered as a styled display box (not editable).
 * - Otherwise: editable TextInput.
 */
const ScoreCell = ({ label, value, onChangeText, readOnly }) => (
  <View style={styles.scoreCell}>
    <Text style={styles.cellLabel}>{label}</Text>
    {readOnly ? (
      <View style={[styles.cellBox, styles.cellBoxReadOnly]}>
        <Text style={styles.cellReadOnlyText}>
          {value !== "" ? value : "—"}
        </Text>
      </View>
    ) : (
      <TextInput
        style={styles.cellBox}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="—"
        placeholderTextColor="#C4C9D4"
      />
    )}
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

/** Locked banner shown across the top of the form when teacher has locked marks */
const LockedBanner = () => (
  <View style={styles.lockedBanner}>
    <Text style={styles.lockedIcon}>🔒</Text>
    <View>
      <Text style={styles.lockedTitle}>Marks Locked</Text>
      <Text style={styles.lockedSub}>
        Your teacher has finalised marks for this subject.
      </Text>
    </View>
  </View>
);

/** Read-only display row used for teacher-entered fields */
const ReadOnlyRow = ({ label, value, max, note }) => (
  <View style={styles.readOnlyRow}>
    <View style={styles.readOnlyLeft}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      {note && <Text style={styles.readOnlyNote}>{note}</Text>}
    </View>
    <View style={styles.readOnlyValueWrap}>
      <Text style={styles.readOnlyValue}>{value !== "" ? value : "—"}</Text>
      <Text style={styles.readOnlyMax}>/{max}</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScoresScreen() {
  const { user } = useAuth();

  // subjects will be fetched from the server; start as an empty array
  const [subjects, setSubjects] = useState([]);
  // selectedSubject should be set once we have subjects available
  const [selectedSubject, setSelectedSubject] = useState("");
  const [fetching, setFetching] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Student-editable fields
  const [internal, setInternal] = useState(Array(6).fill(""));
  const [experiments, setExperiments] = useState(Array(10).fill(""));
  const [assignments, setAssignments] = useState(Array(2).fill(""));

  // Teacher-entered / read-only fields
  const [attendance, setAttendance] = useState("");
  const [practical, setPractical] = useState("");
  const [theory, setTheory] = useState("");

  const departmentId = user?.departmentID || null;

  // load subjects when department id becomes available
  useEffect(() => {
    if (!departmentId) return;
    fetchSubjects(departmentId);
  }, [departmentId]);

  // once subjects are loaded, default to the first one if none selected yet
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]._id);
    }
  }, [subjects, selectedSubject]);

  // fetch scores whenever a valid subject is chosen
  useEffect(() => {
    if (selectedSubject) {
      fetchScores(selectedSubject);
    }
  }, [selectedSubject]);

  const resetFields = () => {
    setInternal(Array(6).fill(""));
    setExperiments(Array(10).fill(""));
    setAssignments(Array(2).fill(""));
    setAttendance("");
    setPractical("");
    setTheory("");
    setIsLocked(false);
  };

  /**
   * Fetch saved scores for the selected subject.
   * Expected response shape:
   * {
   *   marks: {
   *     internalTests: number[],
   *     experiments: number[],
   *     assignments: number[],
   *     attendanceScore: number,
   *     practicalOral: number,
   *     theory: number
   *   }
   * }
   */

  const fetchSubjects = async (departmentId) => {
    const subjectData = await api.get(`/subjects/${departmentId}`);
    setSubjects(subjectData.data);
  };

  const fetchScores = useCallback(
    async (subject) => {
      resetFields();
      setFetching(true);
      try {
        // Fetch lock status for the subject FIRST
        const lockRes = await api.get(
          `/scores/lock/status/${encodeURIComponent(subject)}`,
        );
        const { isLocked: locked } = lockRes.data || {};
        setIsLocked(!!locked);

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
    [user._id, selectedSubject],
  );

  const saveScores = async () => {
    setSaving(true);
    try {
      await api.post("/scores/update", {
        studentId: user._id,
        subjectID: selectedSubject,
        marks: {
          internalTests: internal.map(Number),
          experiments: experiments.map(Number),
          assignments: assignments.map(Number),
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

  // ── Live calculations ──────────────────────────────────────────────────────

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

  // ── Grid renderer ──────────────────────────────────────────────────────────

  const renderGrid = (data, setData, label) => (
    <View style={styles.grid}>
      {data.map((val, i) => (
        <ScoreCell
          key={i}
          label={`${label} ${i + 1}`}
          value={val}
          readOnly={isLocked}
          onChangeText={(text) => {
            if (isLocked) return;
            const arr = [...data];
            arr[i] = text;
            setData(arr);
          }}
        />
      ))}
    </View>
  );

  const currentSubjectType = subjects.find(
    (sub) => sub._id === selectedSubject,
  )?.subjectType;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTag}>MY SCORES</Text>
        <Text style={styles.pageTitle}>Self Assessment</Text>
        <Text style={styles.pageSubtitle}>
          Track your marks as the semester progresses
        </Text>
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

      {/* Lock banner */}
      {isLocked && <LockedBanner />}

      {/* Dim everything while fetching */}
      <View style={fetching ? styles.sectionsDimmed : null}>
        {/* ── Internal Tests ── */}
        {currentSubjectType !== "Lab+Practical" && (
          <View style={styles.card}>
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
          <View style={styles.card}>
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
          <View style={styles.card}>
            <SectionHeader title="Assignments" subtitle="Each out of 5" />
            {renderGrid(assignments, setAssignments, "Assignment")}
            <ResultPill label="Average Score" value={assignmentTotal} max="5" />
          </View>
        )}

        {/* ── Teacher-Entered Fields (read-only for students) ── */}
        <View style={styles.card}>
          <SectionHeader
            title="Teacher-Entered Marks"
            subtitle="These fields are set by your teacher"
          />

          <View style={styles.teacherBadge}>
            <Text style={styles.teacherBadgeText}>🔐 View only</Text>
          </View>

          <ReadOnlyRow
            label="Attendance"
            value={attendance}
            max="5"
            note="Based on your attendance record"
          />
          <View style={styles.rowDivider} />
          {currentSubjectType === "Theory+Lab+Practical" && (
            <ReadOnlyRow
              label="Practical / Oral"
              value={practical}
              max="25"
              note="Entered after practical examination"
            />
          )}
          <View style={styles.rowDivider} />
          {currentSubjectType !== "Lab+Practical" && (
            <ReadOnlyRow
              label="Theory Exam"
              value={theory}
              max="80"
              note="Entered after semester exam"
            />
          )}
        </View>

        {/* ── Grand Total ── */}
        <View style={styles.totalCard}>
          <View style={styles.totalLeft}>
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
          <View style={styles.totalRight}>
            <Text style={styles.totalValue}>{grandTotal}</Text>
            <Text style={styles.totalMax}>
              /{" "}
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
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, isLocked && styles.saveBtnLocked]}
        onPress={isLocked ? null : saveScores}
        disabled={isLocked || saving}
        activeOpacity={isLocked ? 1 : 0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>
            {isLocked ? "Marks Entering is Restricted" : "Save Marks"}
          </Text>
        )}
      </TouchableOpacity>
      {/* Locked footer note */}
      {isLocked && (
        <Text style={styles.lockedFooter}>
          Marks are locked. Contact your teacher if you notice a discrepancy.
        </Text>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
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

  // Subject picker
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

  // Status banners
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

  // Locked banner
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  lockedIcon: { fontSize: 24 },
  lockedTitle: { fontSize: 14, fontWeight: "700", color: "#DC2626" },
  lockedSub: { fontSize: 12, color: "#EF4444", marginTop: 2 },
  lockedFooter: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },

  // Score Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  scoreCell: { alignItems: "center", minWidth: 68 },
  cellLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#9CA3AF",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  cellBox: {
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
  cellBoxReadOnly: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  cellReadOnlyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
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

  // Dimmed sections during loading
  sectionsDimmed: { opacity: 0.4 },

  // Teacher badge
  teacherBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  teacherBadgeText: { fontSize: 11, fontWeight: "600", color: "#92400E" },

  // Read-only rows
  readOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  readOnlyLeft: { flex: 1 },
  readOnlyLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  readOnlyNote: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  readOnlyValueWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  readOnlyValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  readOnlyMax: { fontSize: 12, color: "#9CA3AF" },
  rowDivider: { height: 1, backgroundColor: "#F3F4F6" },

  // Grand Total
  totalCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLeft: {},
  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#6B7280",
    marginBottom: 4,
  },
  totalNote: { fontSize: 11, color: "#4B5563" },
  totalRight: { alignItems: "flex-end" },
  totalValue: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  totalMax: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  saveBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnLocked: {
    backgroundColor: "#D1D5DB",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
