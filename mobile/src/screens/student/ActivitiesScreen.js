import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const activityTypes = [
  "Internship",
  "Work Experience",
  "Value Added Program",
  "Training and Placement Program",
  "Sports",
  "Techfest Prize",
  "Ignite Prize",
  "Extra Activity",
];

const TYPE_META = {
  Internship: { icon: "💼", color: "#2563EB", bg: "#EFF6FF" },
  "Work Experience": { icon: "🏢", color: "#0891B2", bg: "#ECFEFF" },
  "Value Added Program": { icon: "📚", color: "#7C3AED", bg: "#F5F3FF" },
  "Training and Placement Program": {
    icon: "🎯",
    color: "#059669",
    bg: "#ECFDF5",
  },
  Sports: { icon: "🏆", color: "#D97706", bg: "#FFFBEB" },
  "Techfest Prize": { icon: "🤖", color: "#DC2626", bg: "#FEF2F2" },
  "Ignite Prize": { icon: "🔥", color: "#EA580C", bg: "#FFF7ED" },
  "Extra Activity": { icon: "⭐", color: "#6B7280", bg: "#F9FAFB" },
};

const getMeta = (type) =>
  TYPE_META[type] || { icon: "📌", color: "#3B5BDB", bg: "#EEF2FF" };

// ─── Certificate Viewer Modal ─────────────────────────────────────────────────

const CertificateViewer = ({ uri, visible, onClose }) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent
    onRequestClose={onClose}
  >
    <View style={styles.viewerOverlay}>
      <TouchableOpacity style={styles.viewerBackdrop} onPress={onClose} />
      <View style={styles.viewerContainer}>
        <View style={styles.viewerHeader}>
          <Text style={styles.viewerTitle}>Certificate</Text>
          <TouchableOpacity style={styles.viewerClose} onPress={onClose}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri }}
          style={styles.viewerImage}
          resizeMode="contain"
        />
      </View>
    </View>
  </Modal>
);

// ─── Activity Card ────────────────────────────────────────────────────────────

const ActivityCard = ({ item }) => {
  const [certVisible, setCertVisible] = useState(false);
  const meta = getMeta(item.type);

  return (
    <View style={styles.card}>
      {/* Type badge + icon */}
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
          <Text style={styles.typeBadgeIcon}>{meta.icon}</Text>
          <Text style={[styles.typeBadgeText, { color: meta.color }]}>
            {item.type}
          </Text>
        </View>
        {item.certificateUrl && (
          <TouchableOpacity
            style={styles.certBtn}
            onPress={() => setCertVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.certBtnText}>View Certificate →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title & org */}
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.organization ? (
        <Text style={styles.cardOrg}>🏛 {item.organization}</Text>
      ) : null}

      {/* Description */}
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* Certificate thumbnail (tappable) */}
      {item.certificateUrl && (
        <TouchableOpacity
          onPress={() => setCertVisible(true)}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: item.certificateUrl }}
            style={styles.certThumb}
            resizeMode="cover"
          />
          <View style={styles.certThumbOverlay}>
            <Text style={styles.certThumbOverlayText}>
              Tap to view full certificate
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Full certificate viewer */}
      {item.certificateUrl && (
        <CertificateViewer
          uri={item.certificateUrl}
          visible={certVisible}
          onClose={() => setCertVisible(false)}
        />
      )}
    </View>
  );
};

// ─── Add Activity Bottom Sheet ────────────────────────────────────────────────

const AddActivitySheet = ({ visible, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [type, setType] = useState(activityTypes[0]);
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [description, setDescription] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType(activityTypes[0]);
    setTitle("");
    setOrganization("");
    setDescription("");
    setCertificate(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickCertificate = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setCertificate(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title for this activity.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("student", user._id);
      formData.append("type", type);
      formData.append("title", title.trim());
      formData.append("organization", organization.trim());
      formData.append("description", description.trim());

      // Attach the image as a real file — NOT a local URI string
      if (certificate) {
        const filename = certificate.split("/").pop();
        const ext = filename.split(".").pop().toLowerCase();
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";

        formData.append("certificate", {
          uri: certificate,
          name: filename,
          type: mimeType,
        });
      }

      await api.post("/activities/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      reset();
      onSuccess();
    } catch (err) {
      Alert.alert("Error", "Could not save activity. Please try again.");
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  const meta = getMeta(type);

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

          <View style={styles.sheetTitleRow}>
            <View>
              <Text style={styles.sheetTitle}>Add Activity</Text>
              <Text style={styles.sheetSubtitle}>
                Document your achievements & experiences
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={handleClose}
            >
              <Text style={styles.sheetCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Activity Type */}
            <Text style={styles.inputLabel}>ACTIVITY TYPE</Text>
            <View
              style={[styles.pickerWrapper, { borderColor: meta.color + "55" }]}
            >
              <Picker
                selectedValue={type}
                onValueChange={(v) => setType(v)}
                style={styles.picker}
              >
                {activityTypes.map((act) => (
                  <Picker.Item
                    key={act}
                    label={`${getMeta(act).icon}  ${act}`}
                    value={act}
                  />
                ))}
              </Picker>
            </View>

            {/* Selected type preview */}
            <View style={[styles.typePreview, { backgroundColor: meta.bg }]}>
              <Text style={[styles.typePreviewText, { color: meta.color }]}>
                {meta.icon} {type}
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.inputLabel}>TITLE *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Machine Learning Internship at TCS"
              placeholderTextColor="#C4C9D4"
            />

            {/* Organization */}
            <Text style={styles.inputLabel}>ORGANIZATION</Text>
            <TextInput
              style={styles.textInput}
              value={organization}
              onChangeText={setOrganization}
              placeholder="e.g. Tata Consultancy Services"
              placeholderTextColor="#C4C9D4"
            />

            {/* Description */}
            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Briefly describe what you did or achieved…"
              placeholderTextColor="#C4C9D4"
              multiline
              numberOfLines={3}
            />

            {/* Certificate picker */}
            <Text style={styles.inputLabel}>CERTIFICATE</Text>
            <TouchableOpacity
              style={[
                styles.certPicker,
                certificate && styles.certPickerSelected,
              ]}
              onPress={pickCertificate}
              activeOpacity={0.8}
            >
              {certificate ? (
                <View style={styles.certPickerPreview}>
                  <Image
                    source={{ uri: certificate }}
                    style={styles.certPickerThumb}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certPickerSelectedText}>
                      Certificate attached
                    </Text>
                    <Text style={styles.certPickerChangeText}>
                      Tap to change
                    </Text>
                  </View>
                  <Text style={styles.certPickerCheckmark}>✓</Text>
                </View>
              ) : (
                <View style={styles.certPickerEmpty}>
                  <Text style={styles.certPickerEmptyIcon}>🖼️</Text>
                  <Text style={styles.certPickerEmptyText}>
                    Tap to upload certificate image
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Activity</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const { user } = useAuth();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/activities/${user._id}`);
      setActivities(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSuccess = () => {
    setSheetVisible(false);
    fetchActivities();
  };

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTag}>MY PROFILE</Text>
          <Text style={styles.headerTitle}>Activities</Text>
          <Text style={styles.headerSubtitle}>
            {activities.length} achievement{activities.length !== 1 ? "s" : ""}{" "}
            recorded
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#3B5BDB" size="large" />
          <Text style={styles.loadingText}>Loading activities…</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ActivityCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎖️</Text>
              <Text style={styles.emptyTitle}>No activities yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap + Add to record your first achievement
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setSheetVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>Add First Activity</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Add Sheet ── */}
      <AddActivitySheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSuccess={handleSuccess}
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
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  addBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: { fontSize: 13, color: "#9CA3AF" },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Activity Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeIcon: { fontSize: 13 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  certBtn: {
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  certBtnText: { fontSize: 11, fontWeight: "600", color: "#3B5BDB" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardOrg: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  cardDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
    marginBottom: 10,
  },

  // Certificate thumbnail
  certThumb: {
    height: 120,
    borderRadius: 10,
    marginTop: 4,
  },
  certThumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  certThumbOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  // Certificate Viewer
  viewerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  viewerContainer: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  viewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  viewerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  viewerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCloseText: { fontSize: 14, color: "#374151", fontWeight: "700" },
  viewerImage: {
    width: "100%",
    height: 440,
    backgroundColor: "#F9FAFB",
  },

  // Add Sheet
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  sheetSubtitle: { fontSize: 12, color: "#9CA3AF" },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetCloseBtnText: { fontSize: 13, color: "#374151", fontWeight: "700" },

  // Form elements
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9CA3AF",
    marginBottom: 7,
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FAFAFA",
    marginBottom: 8,
  },
  picker: { height: 48, color: "#111827" },
  typePreview: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginBottom: 18,
  },
  typePreviewText: { fontSize: 13, fontWeight: "700" },
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
  textArea: { height: 88, textAlignVertical: "top" },

  // Certificate picker in form
  certPicker: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#FAFAFA",
    marginBottom: 24,
  },
  certPickerSelected: {
    borderStyle: "solid",
    borderColor: "#3B5BDB",
    backgroundColor: "#EEF2FF",
  },
  certPickerEmpty: { flexDirection: "row", alignItems: "center", gap: 10 },
  certPickerEmptyIcon: { fontSize: 22 },
  certPickerEmptyText: { fontSize: 13, color: "#9CA3AF" },
  certPickerPreview: { flexDirection: "row", alignItems: "center", gap: 12 },
  certPickerThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  certPickerSelectedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  certPickerChangeText: { fontSize: 11, color: "#3B5BDB" },
  certPickerCheckmark: { fontSize: 18, color: "#3B5BDB", marginLeft: "auto" },

  // Save button
  saveBtn: {
    backgroundColor: "#3B5BDB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
