import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import TeacherHeader from "../../components/TeacherHeader";

const { width } = Dimensions.get("window");

// ── Helpers ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent = "#6366F1" }) => (
  <View style={styles.statCard}>
    <View style={[styles.iconCircle, { backgroundColor: accent + "15" }]}>
      <Text style={[styles.iconText, { color: accent }]}>{icon}</Text>
    </View>
    <View style={styles.statInfo}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  </View>
);

const ProgressBar = ({ pct, color = "#6366F1" }) => (
  <View style={styles.progressBg}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.min(pct, 100)}%`, backgroundColor: color },
      ]}
    />
  </View>
);

const DetailRow = ({ label, value, color = "#1E293B" }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, { color }]}>{value}</Text>
  </View>
);

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { user, activeSubject } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // all | atRisk
  const [sortBy, setSortBy] = useState("rollNumber"); // rollNumber | cgpa | ia | attendance
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (activeSubject) {
      fetchAnalytics();
    }
  }, [activeSubject]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/teacher/analytics/${user._id}/${activeSubject._id}`,
      );
      setData(res.data);
    } catch (error) {
      console.error("Error fetching analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    let list = [...data.students];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q),
      );
    }

    if (riskFilter === "atRisk") {
      list = list.filter((s) => (s.internalTotal || 0) < 8);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "cgpa":
          return (b.latestCgpa || 0) - (a.latestCgpa || 0);
        case "ia":
          return (b.internalTotal || 0) - (a.internalTotal || 0);
        case "attendance":
          return (b.attendanceRate || 0) - (a.attendanceRate || 0);
        default:
          return (a.rollNumber || "").localeCompare(b.rollNumber || "");
      }
    });

    return list;
  }, [data, search, riskFilter, sortBy]);

  const atRiskCount = useMemo(() => {
    if (!data?.students) return 0;
    return data.students.filter((s) => (s.internalTotal || 0) < 8).length;
  }, [data]);

  if (!activeSubject) {
    return (
      <View style={styles.flexCenter}>
        <TeacherHeader />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Subject Selected</Text>
          <Text style={styles.emptySub}>
            Please select a subject in your Profile to view analytics.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TeacherHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTag}>SUBJECT INSIGHTS</Text>
          <Text style={styles.headerTitle}>{activeSubject.subjectName}</Text>
          <Text style={styles.headerCode}>{activeSubject.subjectCode}</Text>
        </View>

        {loading && !data ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loaderText}>Analyzing data...</Text>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.row}>
                <StatCard
                  icon="👥"
                  label="STUDENTS"
                  value={data?.overview?.totalStudents}
                  accent="#6366F1"
                />
                <StatCard
                  icon="🎯"
                  label="AVG IA MARKS"
                  value={data?.overview?.avgInternalTotal}
                  sub="out of 20"
                  accent="#8B5CF6"
                />
              </View>
              <View style={styles.row}>
                <StatCard
                  icon="📈"
                  label="ATTENDANCE"
                  value={`${data?.overview?.avgAttendanceRate}%`}
                  accent="#10B981"
                />
                <StatCard
                  icon="⚠️"
                  label="AT RISK"
                  value={atRiskCount}
                  sub="Based on IA < 8"
                  accent="#EF4444"
                />
              </View>
            </View>

            {/* Content Header */}
            <View style={styles.listHeader}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <View style={styles.filterRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScroll}
                >
                  <TouchableOpacity
                    onPress={() => setRiskFilter("all")}
                    style={[
                      styles.filterChip,
                      riskFilter === "all" && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        riskFilter === "all" && styles.filterChipTextActive,
                      ]}
                    >
                      All Students
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRiskFilter("atRisk")}
                    style={[
                      styles.filterChip,
                      riskFilter === "atRisk" && styles.filterChipActiveRisk,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        riskFilter === "atRisk" &&
                          styles.filterChipTextActiveRisk,
                      ]}
                    >
                      ⚠️ At Risk
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                <View style={styles.sortContainer}>
                  <Text style={styles.sortLabel}>SORT:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[
                      { id: "rollNumber", label: "Roll #" },
                      { id: "cgpa", label: "CGPA" },
                      { id: "ia", label: "IA" },
                      { id: "attendance", label: "Att." },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSortBy(opt.id)}
                        style={[
                          styles.sortChip,
                          sortBy === opt.id && styles.sortChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            sortBy === opt.id && styles.sortChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Students List */}
            <View style={styles.studentsList}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <View
                    key={st._id}
                    style={[
                      styles.studentCard,
                      st.isAtRisk && styles.studentCardRisk,
                    ]}
                  >
                    <View style={styles.studentTop}>
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor: st.isAtRisk
                              ? "#FEE2E2"
                              : "#EEF2FF",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            { color: st.isAtRisk ? "#DC2626" : "#4F46E5" },
                          ]}
                        >
                          {st.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.studentMeta}>
                        <Text style={styles.studentName}>{st.name}</Text>
                        <Text style={styles.studentRoll}>
                          {st.rollNumber} • Section {st.section}
                        </Text>
                      </View>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreValue}>
                          {st.internalTotal?.toFixed(2) || "0.00"}
                        </Text>
                        <Text style={styles.scoreMax}>/20</Text>
                      </View>
                    </View>

                    <View style={styles.studentBottom}>
                      <View style={styles.attRow}>
                        <Text style={styles.attLabel}>Attendance</Text>
                        <Text
                          style={[
                            styles.attValue,
                            {
                              color:
                                st.attendanceRate < 75 ? "#EF4444" : "#10B981",
                            },
                          ]}
                        >
                          {st.attendanceRate}%
                        </Text>
                      </View>
                      <ProgressBar
                        pct={st.attendanceRate}
                        color={st.attendanceRate < 75 ? "#EF4444" : "#10B981"}
                      />
                      <TouchableOpacity
                        style={styles.viewMoreBtn}
                        onPress={() => setSelectedStudent(st)}
                      >
                        <Text style={styles.viewMoreText}>
                          Detailed Analysis →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>
                    No students found matching your filters.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Student Detail Modal */}
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedStudent?.rollNumber} • Section{" "}
                  {selectedStudent?.section}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedStudent(null)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>PERFORMANCE SUMMARY</Text>
                <View style={styles.detailGrid}>
                  <DetailRow
                    label="Internal Assessment"
                    value={`${selectedStudent?.internalTotal?.toFixed(2)} / 20`}
                    color={
                      (selectedStudent?.internalTotal || 0) < 8
                        ? "#EF4444"
                        : "#4F46E5"
                    }
                  />
                  <DetailRow
                    label="Current Attendance"
                    value={`${selectedStudent?.attendanceRate}%`}
                    color={
                      (selectedStudent?.attendanceRate || 0) < 75
                        ? "#EF4444"
                        : "#10B981"
                    }
                  />
                  <DetailRow
                    label="Latest CGPA"
                    value={selectedStudent?.latestCgpa?.toFixed(2) || "N/A"}
                  />
                  <DetailRow
                    label="Theory Marks"
                    value={`${selectedStudent?.theory?.toFixed(2) || 0} / 40`}
                  />
                </View>
              </View>

              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>LAB & PRACTICALS</Text>
                <DetailRow
                  label="Experiments Done"
                  value={`${
                    selectedStudent?.experiments?.filter((v) => v > 0).length ||
                    0
                  } / 10`}
                />
                <DetailRow
                  label="Assignments Submitted"
                  value={`${
                    selectedStudent?.assignments?.filter((v) => v > 0).length ||
                    0
                  } / 2`}
                />
              </View>

              <View style={styles.riskStatus}>
                <View
                  style={[
                    styles.riskIndicator,
                    {
                      backgroundColor:
                        (selectedStudent?.internalTotal || 0) < 8
                          ? "#FEE2E2"
                          : "#ECFDF5",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.riskTag,
                      {
                        color:
                          (selectedStudent?.internalTotal || 0) < 8
                            ? "#EF4444"
                            : "#10B981",
                      },
                    ]}
                  >
                    Status:{" "}
                    {(selectedStudent?.internalTotal || 0) < 8
                      ? "At Risk (Low IA)"
                      : "Safe"}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  flexCenter: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20 },

  // Header
  headerSection: { marginBottom: 24 },
  headerTag: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6366F1",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  headerCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },

  // Stats Grid
  statsGrid: { gap: 12, marginBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20 },
  statInfo: { marginLeft: 12 },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    marginVertical: 1,
  },
  statSub: { fontSize: 9, color: "#94A3B8" },

  // List Controls
  listHeader: { marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1E293B" },
  filterRow: {
    flexDirection: "column",
    gap: 12,
  },
  filterScroll: { flexDirection: "row" },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 100,
    alignItems: "center",
  },
  filterChipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  filterChipActiveRisk: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  filterChipText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  filterChipTextActive: { color: "#FFF" },
  filterChipTextActiveRisk: { color: "#FFF" },

  // Sorting
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    marginRight: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sortChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  sortChipTextActive: {
    color: "#6366F1",
  },

  // Student Cards
  studentsList: { gap: 12 },
  studentCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  studentCardRisk: { borderColor: "#FEE2E2", backgroundColor: "#FFFAFA" },
  studentTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800" },
  studentMeta: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: "800", color: "#1E293B" },
  studentRoll: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  scoreBadge: { alignItems: "flex-end" },
  scoreValue: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  scoreMax: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },

  studentBottom: { marginTop: 16 },
  attRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  attLabel: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  attValue: { fontSize: 11, fontWeight: "900" },
  progressBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  viewMoreBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#64748B",
  },
  modalBody: {
    marginBottom: 20,
  },
  analysisSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6366F1",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  detailGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  riskStatus: {
    marginTop: 8,
  },
  riskIndicator: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  riskTag: {
    fontSize: 14,
    fontWeight: "800",
  },

  // Empty/Loader
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  emptySub: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  loaderContainer: { alignItems: "center", marginTop: 100 },
  loaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 12,
  },
  noResults: { padding: 40, alignItems: "center" },
  noResultsText: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
});
