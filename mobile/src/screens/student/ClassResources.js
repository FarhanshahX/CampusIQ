import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api, { API_BASE_URL } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

// const subjects = [
//   "All Subjects",
//   "Software Engineering",
//   "Operating Systems",
//   "Computer Networks",
//   "Database Management Systems",
//   "Microprocessor",
// ];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILE_ICONS = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  ppt: "📊",
  pptx: "📊",
  xls: "📋",
  xlsx: "📋",
  zip: "🗜️",
  mp4: "🎬",
  mp3: "🎵",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
};

const FILE_COLORS = {
  pdf: { bg: "#FEF2F2", accent: "#DC2626" },
  doc: { bg: "#EFF6FF", accent: "#2563EB" },
  docx: { bg: "#EFF6FF", accent: "#2563EB" },
  ppt: { bg: "#FFF7ED", accent: "#EA580C" },
  pptx: { bg: "#FFF7ED", accent: "#EA580C" },
  xls: { bg: "#F0FDF4", accent: "#16A34A" },
  xlsx: { bg: "#F0FDF4", accent: "#16A34A" },
  zip: { bg: "#F5F3FF", accent: "#7C3AED" },
  mp4: { bg: "#FDF4FF", accent: "#A21CAF" },
  mp3: { bg: "#FDF4FF", accent: "#A21CAF" },
};

const getFileIcon = (name = "") =>
  FILE_ICONS[(name.split(".").pop() || "").toLowerCase()] || "📎";
const getFileExt = (name = "") =>
  (name.split(".").pop() || "FILE").toUpperCase();
const getFileColors = (name = "") =>
  FILE_COLORS[(name.split(".").pop() || "").toLowerCase()] || {
    bg: "#F0F4FF",
    accent: "#3B5BDB",
  };

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptyState = ({ subject }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>No resources yet</Text>
    <Text style={styles.emptySubtitle}>
      {subject === "All Subjects"
        ? "Your teacher hasn't uploaded any materials yet."
        : `No materials uploaded for ${subject} yet.`}
    </Text>
  </View>
);

const ResourceCard = ({ item }) => {
  const colors = getFileColors(item.fileName);
  const size = formatSize(item.fileSize);

  const handleOpen = () => {
    if (item.fileUrl) {
      const fullUrl = `${API_BASE_URL}${item.fileUrl}`;
      Linking.openURL(fullUrl).catch((err) => {
        console.error("Failed to open file:", err);
        // You could show an alert here
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleOpen}
      activeOpacity={0.75}
    >
      {/* File icon */}
      <View style={[styles.cardIconWrap, { backgroundColor: colors.bg }]}>
        <Text style={styles.cardIcon}>{getFileIcon(item.fileName)}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardMeta}>
          {/* Extension badge */}
          <View style={[styles.extBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.extBadgeText, { color: colors.accent }]}>
              {getFileExt(item.fileName)}
            </Text>
          </View>
          {size && <Text style={styles.metaText}>{size}</Text>}
          {item.subject && (
            <Text style={styles.subjectChip}>{item.subject}</Text>
          )}
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {/* Open arrow */}
      <View style={styles.cardArrow}>
        <Text style={styles.cardArrowText}>↗</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StudentResourceScreen() {
  const [subjects, setSubjects] = useState(["All Subjects"]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const studentId = user._id;
  const departmentId = user.departmentID;

  const fetchSubjects = useCallback(async (deptId) => {
    try {
      const res = await api.get(`/subjects/${deptId}`);
      const subs = res.data || [];
      setSubjects(res.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const fetchResources = useCallback(async (subjectId) => {
    setLoading(true);
    try {
      const res = await api.get(`/resources/subject/${subjectId}`);
      setResources(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects(departmentId);
  }, []);

  useEffect(() => {
    fetchResources(selectedSubject._id);
  }, [selectedSubject]);

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTag}>STUDY MATERIALS</Text>
        <Text style={styles.headerTitle}>Resources</Text>
        <Text style={styles.headerSubtitle}>
          Access files shared by your teacher
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subject Filter ── */}
        <View style={styles.filterCard}>
          <Text style={styles.fieldLabel}>SUBJECT</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedSubject}
              onValueChange={(val) => setSelectedSubject(val)}
              style={styles.picker}
            >
              {subjects.map((sub) => (
                <Picker.Item
                  key={sub._id}
                  label={sub.subjectName}
                  value={sub}
                />
              ))}
            </Picker>
          </View>

          {/* Live count badge */}
          {!loading && (
            <View style={styles.countRow}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {resources.length} file{resources.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <Text style={styles.countLabel}>
                {selectedSubject === "All Subjects"
                  ? "across all subjects"
                  : `for ${selectedSubject.subjectName}`}
              </Text>
            </View>
          )}
        </View>

        {/* ── Resource List ── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#3B5BDB" size="large" />
            <Text style={styles.loadingText}>Fetching resources…</Text>
          </View>
        ) : resources.length === 0 ? (
          <EmptyState subject={selectedSubject} />
        ) : (
          <>
            <View style={styles.listHeader}>
              <View style={styles.listDividerLine} />
              <Text style={styles.listDividerText}>FILES</Text>
              <View style={styles.listDividerLine} />
            </View>

            {resources.map((item) => (
              <ResourceCard key={item._id} item={item} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FA" },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#3B5BDB",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 3,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Filter card
  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 10,
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
    marginBottom: 12,
  },
  picker: { height: 48, color: "#111827" },

  // Count row
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B5BDB",
  },
  countLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Section divider
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  listDividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  listDividerText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginHorizontal: 12,
  },

  // Resource card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardIcon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 7,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  extBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  extBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaText: { fontSize: 11, color: "#9CA3AF" },
  subjectChip: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardArrow: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  cardArrowText: { fontSize: 16, color: "#3B5BDB" },

  // Loading
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 14,
  },
  loadingText: { fontSize: 13, color: "#9CA3AF" },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 72,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
