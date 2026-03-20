import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import api from "../../api/axios";

// ─────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────
const C = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  primary: "#3B5BDB",
  accent: "#457B9D",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  star: "#F59E0B",
};

export default function MessagesScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/announcements/student");
      setAnnouncements(res.data || []);
    } catch (e) {
      console.log("Error fetching announcements", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const dDate = new Date(item.createdAt);
    const dateStr = dDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let deadlineStr = null;
    if (item.deadline) {
      const dline = new Date(item.deadline);
      deadlineStr = dline.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const teacherName = item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : "Unknown Teacher";

    return (
      <View style={[s.card, item.isImportant && s.cardImportant]}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.isImportant && (
            <Text style={s.importantBadge}>Important</Text>
          )}
        </View>

        <Text style={s.cardMeta}>
          {dateStr} at {timeStr}
          {item.subject ? ` · ${item.subject.subjectName}` : ` · General Subject`}
        </Text>
        
        <Text style={s.cardTeacher}>Posted by {teacherName}</Text>

        <View style={s.divider} />

        <Text style={s.cardMessage}>{item.message}</Text>

        {deadlineStr && (
          <View style={s.deadlineBadge}>
            <Text style={s.deadlineText}>Deadline: {deadlineStr}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* PAGE HEADER */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Announcements</Text>
        <Text style={s.pageSub}>Important updates and messages from teachers</Text>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
      ) : announcements.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyStateTitle}>You're all caught up!</Text>
          <Text style={s.emptyStateSub}>No new announcements right now.</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },
  pageHeader: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 14,
    color: C.muted,
    marginTop: 4,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: C.muted,
  },
  
  // Card Styles
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  cardImportant: {
    borderLeftColor: C.star,
    backgroundColor: "#FFFBEB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    flex: 1,
  },
  importantBadge: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
    overflow: "hidden",
  },
  cardMeta: {
    fontSize: 12,
    color: C.muted,
    marginTop: 6,
  },
  cardTeacher: {
    fontSize: 12,
    fontWeight: "600",
    color: C.accent,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  cardMessage: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  deadlineBadge: {
    backgroundColor: C.dangerBg,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 14,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.danger,
  },
});
