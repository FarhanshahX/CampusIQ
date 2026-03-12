import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import api, { API_BASE_URL } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

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

const getFileIcon = (filename = "") => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || "📎";
};

const getFileExt = (filename = "") =>
  filename.split(".").pop()?.toUpperCase() || "FILE";

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
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionDivider = ({ title }) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>{title}</Text>
    <View style={styles.dividerLine} />
  </View>
);

const ResourceCard = ({ item, onDelete }) => (
  <View style={styles.resourceCard}>
    <View style={styles.resourceIconWrap}>
      <Text style={styles.resourceIcon}>{getFileIcon(item.fileName)}</Text>
    </View>
    <View style={styles.resourceInfo}>
      <Text style={styles.resourceTitle} numberOfLines={1}>
        {item.title}
      </Text>
      {item.description ? (
        <Text style={styles.resourceDesc} numberOfLines={1}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.resourceMeta}>
        <View style={styles.extBadge}>
          <Text style={styles.extBadgeText}>{getFileExt(item.fileName)}</Text>
        </View>
        {item.fileSize ? (
          <Text style={styles.metaText}>{formatSize(item.fileSize)}</Text>
        ) : null}
        <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
    <View style={styles.resourceActions}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => {
          if (item.fileUrl) {
            const fullUrl = `${API_BASE_URL}${item.fileUrl}`;
            Linking.openURL(fullUrl).catch((err) => {
              console.error("Failed to open file:", err);
            });
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.actionBtnText}>↗</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.actionBtnDelete]}
        onPress={() => onDelete(item._id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionBtnText, styles.actionBtnDeleteText]}>
          ✕
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📂</Text>
    <Text style={styles.emptyTitle}>No resources yet</Text>
    <Text style={styles.emptySubtitle}>Files you upload will appear here</Text>
  </View>
);

// ─── Upload Sheet (Modal) ─────────────────────────────────────────────────────

const UploadSheet = ({ visible, onClose, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [subjectId, setSubjectId] = useState(null);

  const teacherId = useAuth().user._id;

  useEffect(() => {
    // Fetch the teacher's subjects to associate the resource with one
    const fetchSubjects = async (teacherId) => {
      try {
        const res = await api.get(`/subjects/teacher/${teacherId}`);
        if (res.data && res.data.length > 0) {
          setSubjectId(res.data[0]._id); // Default to first subject
        }
      } catch (err) {
        console.log("Error fetching subjects: ", err);
      }
    };
    fetchSubjects(teacherId);
  }, [teacherId]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      // if (res.type) {
      setFile({
        uri: res.assets[0].uri,
        name: res.assets[0].name,
        type: res.assets[0].mimeType || "application/octet-stream",
        size: res.assets[0].size,
      });
      // }
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please give this resource a title.");
      return;
    }
    if (!file) {
      Alert.alert("No file selected", "Please select a file to upload.");
      return;
    }
    if (!subjectId) {
      // Add this check
      Alert.alert("No subject", "Could not load your subjects. Try again.");
      return;
    }
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("subjectId", subjectId);
    formData.append("teacherId", teacherId);
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    setUploading(true);
    try {
      await api.post("/resources/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      reset();
      onSuccess();
    } catch (error) {
      Alert.alert("Upload failed", "Something went wrong. Please try again.");
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Upload Resource</Text>
          <Text style={styles.sheetSubtitle}>
            Share study materials with your students
          </Text>

          {/* Title input */}
          <Text style={styles.inputLabel}>TITLE *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Unit 3 Notes — Normalization"
            placeholderTextColor="#C4C9D4"
          />

          {/* Description input */}
          <Text style={styles.inputLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional — what's this file about?"
            placeholderTextColor="#C4C9D4"
            multiline
            numberOfLines={3}
          />

          {/* File picker */}
          <Text style={styles.inputLabel}>FILE *</Text>
          <TouchableOpacity
            style={[styles.filePicker, file && styles.filePickerSelected]}
            onPress={pickFile}
            activeOpacity={0.8}
          >
            {file ? (
              <View style={styles.filePickerInner}>
                <Text style={styles.filePickerIcon}>
                  {getFileIcon(file.name)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filePickerName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  {file.size ? (
                    <Text style={styles.filePickerSize}>
                      {formatSize(file.size)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.filePickerChange}>Change</Text>
              </View>
            ) : (
              <View style={styles.filePickerInner}>
                <Text style={styles.filePickerEmptyIcon}>⊕</Text>
                <Text style={styles.filePickerEmptyText}>
                  Tap to select a file
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload button */}
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <View style={styles.uploadBtnInner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.uploadBtnText}>Uploading…</Text>
              </View>
            ) : (
              <Text style={styles.uploadBtnText}>Upload Resource</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TeacherResourceScreen() {
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      const res = await api.get("/resources");
      setResources(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Resource",
      "This will permanently remove the file for all students. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/resources/${id}`);
              setResources((prev) => prev.filter((r) => r._id !== id));
            } catch (err) {
              Alert.alert("Error", "Could not delete. Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    fetchResources();
    Alert.alert("Uploaded!", "Your resource is now available to students.");
  };

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTag}>TEACHER PORTAL</Text>
          <Text style={styles.headerTitle}>Resources</Text>
          <Text style={styles.headerSubtitle}>
            {resources.length} file{resources.length !== 1 ? "s" : ""} shared
            with students
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowUpload(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {/* ── Resource List ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionDivider title="UPLOADED FILES" />

        {loadingResources ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#3B5BDB" />
            <Text style={styles.loadingText}>Loading resources…</Text>
          </View>
        ) : resources.length === 0 ? (
          <EmptyState />
        ) : (
          resources.map((item) => (
            <ResourceCard key={item._id} item={item} onDelete={handleDelete} />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Upload Modal ── */}
      <UploadSheet
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={handleUploadSuccess}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FA" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 56,
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
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // List
  list: { flex: 1 },
  listContent: { padding: 20 },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginHorizontal: 12,
  },

  // Resource Card
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resourceIcon: { fontSize: 22 },
  resourceInfo: { flex: 1 },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  resourceDesc: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  resourceMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  extBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  extBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#3B5BDB",
    letterSpacing: 0.5,
  },
  metaText: { fontSize: 11, color: "#9CA3AF" },
  resourceActions: { flexDirection: "row", gap: 6, marginLeft: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, color: "#374151" },
  actionBtnDelete: { backgroundColor: "#FEF2F2" },
  actionBtnDeleteText: { color: "#DC2626", fontSize: 12 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF" },

  // Loading
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: { fontSize: 13, color: "#9CA3AF" },

  // Upload Sheet (Modal)
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
  },

  // Form inputs
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginBottom: 7,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
    fontSize: 14,
    color: "#111827",
    marginBottom: 18,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  // File picker
  filePicker: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#FAFAFA",
    marginBottom: 24,
  },
  filePickerSelected: {
    borderStyle: "solid",
    borderColor: "#3B5BDB",
    backgroundColor: "#EEF2FF",
  },
  filePickerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filePickerIcon: { fontSize: 24 },
  filePickerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  filePickerSize: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  filePickerChange: { fontSize: 12, color: "#3B5BDB", fontWeight: "600" },
  filePickerEmptyIcon: { fontSize: 22, color: "#9CA3AF" },
  filePickerEmptyText: { fontSize: 13, color: "#9CA3AF" },

  // Upload button
  uploadBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
