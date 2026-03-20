import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";
import TeacherHeader from "../../components/TeacherHeader";
import api from "../../api/axios";

// ─────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────
const C = {
  bg: "#F7F8FA",
  surface: "#FFFFFF",
  primary: "#3B5BDB",
  primaryMuted: "#EBF3FF",
  accent: "#457B9D",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  star: "#F59E0B",
};

// ─────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────
const Divider = () => <View style={s.divider} />;

export default function AnnouncementScreen() {
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState(null);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data State
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  useEffect(() => {
    fetchSubjects();
    fetchAnnouncements();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects/teacher/${user._id}`);
      setSubjects(res.data || []);
    } catch (e) {
      console.log("Error fetching subjects", e);
    }
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/announcements/teacher", {
        params: { userId: user._id },
      });
      setAnnouncements(res.data || []);
    } catch (e) {
      console.log("Error fetching announcements", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDeadline(selectedDate);
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Required Fields", "Please enter a title and message.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        isImportant,
        subjectId: subjectId === "" ? undefined : subjectId,
        deadline: deadline ? deadline.toISOString() : undefined,
        userId: user._id,
      };

      await api.post("/announcements", payload);

      // Reset form
      setTitle("");
      setMessage("");
      setIsImportant(false);
      setSubjectId("");
      setDeadline(null);

      Alert.alert("Success", "Announcement posted!");
      fetchAnnouncements();
    } catch (e) {
      console.log("Error creating announcement", e);
      Alert.alert("Error", "Failed to post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/announcements/${id}`, {
                params: { userId: user._id },
              });
              fetchAnnouncements();
            } catch (e) {
              Alert.alert("Error", "Failed to delete announcement.");
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const dDate = new Date(item.createdAt);
    const dateStr = dDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = dDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let deadlineStr = null;
    if (item.deadline) {
      const dline = new Date(item.deadline);
      deadlineStr = dline.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    return (
      <View style={[s.listItem, item.isImportant && s.listItemImportant]}>
        <View style={s.listHeader}>
          <Text style={s.listTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.isImportant && <Text style={s.importantBadge}>Important</Text>}
        </View>

        <Text style={s.listMeta}>
          {dateStr} at {timeStr}
          {item.subject
            ? ` · ${item.subject.subjectName}`
            : ` · General Subject`}
        </Text>

        <Text style={s.listMessage}>{item.message}</Text>

        {deadlineStr && (
          <View style={s.deadlineBadge}>
            <Text style={s.deadlineText}>Deadline: {deadlineStr}</Text>
          </View>
        )}

        <View style={s.listActions}>
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            style={s.deleteBtn}
          >
            <Text style={s.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <TeacherHeader />
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* PAGE HEADER */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Announcements</Text>
          <Text style={s.pageSub}>Broadcast messages to your students</Text>
        </View>

        {/* CREATE CARD */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Post New Announcement</Text>

          <Text style={s.label}>
            Title <Text style={{ color: C.danger }}>*</Text>
          </Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Midterm Exam Schedule"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={s.label}>
            Message <Text style={{ color: C.danger }}>*</Text>
          </Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Write your announcement..."
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />

          <Text style={s.label}>Subject (Optional)</Text>
          <View style={s.pickerWrap}>
            <Picker
              selectedValue={subjectId}
              onValueChange={setSubjectId}
              style={s.picker}
            >
              <Picker.Item label="All Subjects (General)" value="" />
              {subjects.map((sub) => (
                <Picker.Item
                  key={sub._id}
                  label={sub.subjectName}
                  value={sub._id}
                />
              ))}
            </Picker>
          </View>

          <View style={s.row}>
            {/* Importance Toggle */}
            <TouchableOpacity
              style={[s.toggleBtn, isImportant && s.toggleBtnActive]}
              onPress={() => setIsImportant(!isImportant)}
              activeOpacity={0.7}
            >
              <Text style={[s.toggleText, isImportant && s.toggleTextActive]}>
                {isImportant ? "★ Marked as Important" : "☆ Mark Important"}
              </Text>
            </TouchableOpacity>

            {/* Deadline Button */}
            <TouchableOpacity
              style={s.dateBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={s.dateBtnText}>
                {deadline
                  ? `Due: ${deadline.toLocaleDateString()}`
                  : "+ Add Deadline"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity
            style={s.submitBtn}
            onPress={handleCreate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.submitBtnText}>Post Announcement</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* HISTORY CARD */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Past Announcements</Text>
          <Divider />

          {loading ? (
            <ActivityIndicator
              size="large"
              color={C.primary}
              style={{ marginTop: 20 }}
            />
          ) : announcements.length === 0 ? (
            <Text style={s.emptyText}>
              You haven't posted any announcements yet.
            </Text>
          ) : (
            <FlatList
              data={announcements}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </>
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
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#FAFAFA",
  },
  textArea: {
    minHeight: 80,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: C.text,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  toggleBtnActive: {
    borderColor: C.star,
    backgroundColor: "#FFFBEB",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.muted,
  },
  toggleTextActive: {
    color: "#D97706",
  },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: C.primaryMuted,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.primary,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    color: C.muted,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },

  // List Item Styles
  listItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  listItemImportant: {
    backgroundColor: "#FFFBEB",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: C.star,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },
  importantBadge: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
    overflow: "hidden",
  },
  listMeta: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4,
    marginBottom: 8,
  },
  listMessage: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  deadlineBadge: {
    backgroundColor: C.dangerBg,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.danger,
  },
  listActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: C.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});
