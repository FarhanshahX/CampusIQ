import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../context/AuthContext";
import TeacherHeader from "../../components/TeacherHeader";
import api from "../../api/axios";
import { startAdvertising, stopAdvertising } from "../../utils/BLEManager";

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

const SESSION_TYPES = ["Lecture", "Practical", "Extra Class"];
const SECTIONS = ["A", "B", "C", "D"];
const DURATIONS = [
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "20 minutes", value: 20 },
  { label: "30 minutes", value: 30 },
];

// ─────────────────────────────────────────────
// PALETTE
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
  text: "#1A1A2E",
  muted: "#6C757D",
  border: "#DDE3F0",
  live: "#E63946",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const snapToSlot = () => {
  const now = new Date();
  const start = new Date(now);
  if (now.getMinutes() < 15) start.setMinutes(0);
  else if (now.getMinutes() < 45) start.setMinutes(30);
  else {
    start.setHours(now.getHours() + 1);
    start.setMinutes(0);
  }
  start.setSeconds(0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  const fmt = (d) =>
    `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

const formatTimer = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

const pct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

const Divider = () => <View style={s.divider} />;

const SectionHeading = ({ title, subtitle }) => (
  <View style={s.headingWrap}>
    <Text style={s.headingText}>{title}</Text>
    {subtitle ? <Text style={s.headingSub}>{subtitle}</Text> : null}
  </View>
);

const Badge = ({ label, color, bg }) => (
  <View style={[s.badge, { backgroundColor: bg }]}>
    <Text style={[s.badgeText, { color }]}>{label}</Text>
  </View>
);

const ProgressBar = ({ value }) => (
  <View style={s.progressTrack}>
    <View
      style={[
        s.progressFill,
        {
          width: `${Math.min(value, 100)}%`,
          backgroundColor:
            value >= 75 ? C.success : value >= 50 ? C.warn : C.danger,
        },
      ]}
    />
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value || "—"}</Text>
  </View>
);

const StatTile = ({ label, value, accent }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, accent && { color: C.accent }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ── BLE status indicator shown while session is active ────────────────────────
const BleStatusChip = ({ advertising }) => (
  <View
    style={[
      s.bleChip,
      { backgroundColor: advertising ? "#E8F5E9" : "#FFF3E0" },
    ]}
  >
    <Text style={s.bleChipIcon}>{advertising ? "📡" : "⚠️"}</Text>
    <Text style={[s.bleChipText, { color: advertising ? C.success : C.warn }]}>
      {advertising ? "BLE Broadcasting" : "BLE Stopped"}
    </Text>
  </View>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function TeacherAttendanceScreen() {
  const { user, activeSubject } = useAuth();

  // ── Session form ──────────────────────────
  const [sessionType, setSessionType] = useState("Lecture");
  const [section, setSection] = useState("A");
  const [duration, setDuration] = useState(10);
  const [topic, setTopic] = useState("");
  const [lecturePeriod, setLecturePeriod] = useState("");

  // ── Active session ────────────────────────
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [bluetoothToken, setBluetoothToken] = useState(null);
  const [advertising, setAdvertising] = useState(false); // BLE broadcast state
  const [timer, setTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── History / filters ─────────────────────
  const [filterMonth, setFilterMonth] = useState("overall");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [allStudents, setAllStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    rate: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  useEffect(() => {
    setLecturePeriod(snapToSlot());
    if (user) recoverActiveSession();
  }, [user]);

  const recoverActiveSession = async () => {
    try {
      const res = await api.get(
        `/attendance/active-teacher-session?teacherId=${user._id}`,
      );
      const sess = res.data;
      if (sess) {
        setSessionId(sess._id);
        setBluetoothToken(sess.bluetoothToken);
        setSessionActive(true);

        // Calculate remaining time
        const createdAt = new Date(sess.createdAt).getTime();
        const now = new Date().getTime();
        const elapsedSec = Math.floor((now - createdAt) / 1000);
        const totalSec = sess.duration * 60;
        const remaining = Math.max(0, totalSec - elapsedSec);

        setTimer(remaining);
        setSessionType(sess.sessionType);
        if (sess.section) setSection(sess.section);
        setDuration(sess.duration);
        setTopic(sess.topic);
        setLecturePeriod(
          `${new Date(sess.lectureStart).getHours()}:${String(new Date(sess.lectureStart).getMinutes()).padStart(2, "0")} - ${new Date(sess.lectureEnd).getHours()}:${String(new Date(sess.lectureEnd).getMinutes()).padStart(2, "0")}`,
        );
      }
    } catch (e) {
      console.log("recoverActiveSession:", e);
    }
  };

  // Pulse animation for live dot
  useEffect(() => {
    if (!sessionActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sessionActive]);

  // Countdown timer
  useEffect(() => {
    if (!sessionActive || timer <= 0) return;
    const id = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [sessionActive, timer]);

  // Auto-close when timer hits 0
  useEffect(() => {
    if (sessionActive && timer === 0) handleCloseSession();
  }, [timer, sessionActive]);

  // ── BLE: start advertising when a session becomes active ─────────────────
  useEffect(() => {
    if (!sessionActive || !bluetoothToken) return;

    let active = true;

    (async () => {
      try {
        await startAdvertising(bluetoothToken);
        if (active) setAdvertising(true);
      } catch (err) {
        console.warn("[BLE] Could not start advertising:", err.message);
        // Non-fatal — session still works; BLE is just unavailable on this device
        Alert.alert(
          "Bluetooth Unavailable",
          "Could not start BLE broadcast. Students will not be proximity-verified.\n\n" +
            err.message,
        );
        if (active) setAdvertising(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionActive, bluetoothToken]);

  // ── BLE: stop advertising when the session is no longer active ────────────
  useEffect(() => {
    if (!sessionActive && advertising) {
      stopAdvertising().catch(console.warn);
      setAdvertising(false);
    }
  }, [sessionActive]);

  // Stop BLE on unmount (but DON'T close the server session)
  useEffect(() => {
    return () => {
      if (advertising) {
        stopAdvertising().catch(console.warn);
      }
    };
  }, [advertising]);

  // Re-fetch history when filters change
  useEffect(() => {
    if (activeSubject) fetchHistory();
  }, [filterMonth, filterStudent, filterType, activeSubject]);

  // ─────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────

  const handleStartSession = async () => {
    if (!activeSubject) {
      Alert.alert(
        "No Subject",
        "No active subject found. Please select one in your Profile.",
      );
      return;
    }
    try {
      // ── Step 1: Get total count of enrolled students ──────────────────────
      // We call the history endpoint with no filters to get the 'students' list
      // which our backend now populates with all enrolled students.
      const historyRes = await api.get(
        `/attendance/history?subjectId=${activeSubject._id}`,
      );
      const enrolledCount = historyRes.data.students?.length || 0;

      const [startTime, endTime] = lecturePeriod.split(" - ");
      const res = await api.post("/attendance/start", {
        subject: activeSubject._id,
        department: activeSubject.department._id,
        semester: activeSubject.semester,
        section,
        sessionType,
        lectureStart: startTime.trim(),
        lectureEnd: endTime.trim(),
        duration,
        topic,
        totalStudents: enrolledCount, // ← pass the count here
        user: user._id,
      });

      const sess = res.data.session;
      setSessionId(sess._id);
      setBluetoothToken(sess.bluetoothToken); // ← triggers the BLE useEffect above
      setSessionActive(true);
      setTimer(duration * 60);

      Alert.alert(
        "Session Started",
        "BLE broadcasting started. Students nearby can now mark attendance.",
      );
    } catch (e) {
      console.log(e.response?.data);
      Alert.alert(
        "Error",
        e.response?.data?.message || "Failed to start session.",
      );
    }
  };

  const handleCloseSession = async () => {
    try {
      await api.put(`/attendance/close/${sessionId}`, { userId: user._id });
      await stopAdvertising(); // ← stop BLE broadcast
      setAdvertising(false);
      setSessionActive(false);
      setSessionId(null);
      setBluetoothToken(null);
      Alert.alert("Session Ended", "Attendance session has been closed.");
      fetchHistory();
    } catch (e) {
      console.log(e);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!activeSubject) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: activeSubject._id });
      if (filterMonth !== "overall") params.append("month", filterMonth);
      if (filterStudent !== "all") params.append("studentId", filterStudent);
      if (filterType !== "all") params.append("type", filterType);

      const res = await api.get(`/attendance/history?${params.toString()}`);
      setHistory(res.data.history || []);
      setSummary(
        res.data.summary || {
          totalClasses: 0,
          attended: 0,
          absent: 0,
          rate: 0,
        },
      );
      if (res.data.students && filterStudent === "all") {
        setAllStudents(res.data.students || []);
      }
    } catch (e) {
      console.log("fetchHistory:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeSubject, filterMonth, filterStudent, filterType]);

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────
  const renderHistoryRow = ({ item, index }) => (
    <View style={[s.tableRow, index % 2 === 0 && s.tableRowAlt]}>
      <Text style={[s.tableCell, { flex: 1.8 }]}>{item.date}</Text>
      <Text style={[s.tableCell, { flex: 2.5 }]} numberOfLines={1}>
        {item.studentName}
      </Text>
      <View style={[s.tableCell, { flex: 1.4, alignItems: "center" }]}>
        <Badge
          label={item.status}
          color={item.status === "PRESENT" ? C.success : C.danger}
          bg={item.status === "PRESENT" ? C.successBg : C.dangerBg}
        />
      </View>
    </View>
  );

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <>
      <TeacherHeader />
      <ScrollView
        style={s.screen}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* PAGE HEADER */}
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Attendance</Text>
            <Text style={s.pageSub}>
              Manage sessions & track student presence
            </Text>
          </View>
          {sessionActive && (
            <View style={s.liveChip}>
              <Animated.View
                style={[s.liveDot, { transform: [{ scale: pulseAnim }] }]}
              />
              <Text style={s.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════
            SECTION 1 — SESSION CARD
        ══════════════════════════════════════ */}
        <View style={s.card}>
          {!sessionActive ? (
            <>
              <SectionHeading
                title="Start Attendance Session"
                subtitle={`Subject: ${activeSubject?.subjectName || "None selected"}`}
              />

              {/* Session Type */}
              <Text style={s.fieldLabel}>Session Type</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={sessionType}
                  onValueChange={setSessionType}
                  style={s.picker}
                >
                  {SESSION_TYPES.map((t) => (
                    <Picker.Item key={t} label={t} value={t} />
                  ))}
                </Picker>
              </View>

              {/* Section (Practical only) */}
              {sessionType === "Practical" && (
                <>
                  <Text style={s.fieldLabel}>Batch / Section</Text>
                  <View style={s.pickerWrap}>
                    <Picker
                      selectedValue={section}
                      onValueChange={setSection}
                      style={s.picker}
                    >
                      {SECTIONS.map((sec) => (
                        <Picker.Item
                          key={sec}
                          label={`Batch ${sec}`}
                          value={sec}
                        />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {/* Lecture Period */}
              <Text style={s.fieldLabel}>Lecture Period (HH:MM - HH:MM)</Text>
              <TextInput
                style={s.textInput}
                value={lecturePeriod}
                onChangeText={setLecturePeriod}
                placeholder="e.g. 9:00 - 10:00"
                placeholderTextColor={C.muted}
              />

              {/* Duration */}
              <Text style={s.fieldLabel}>Attendance Window</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={duration}
                  onValueChange={setDuration}
                  style={s.picker}
                >
                  {DURATIONS.map((d) => (
                    <Picker.Item
                      key={d.value}
                      label={d.label}
                      value={d.value}
                    />
                  ))}
                </Picker>
              </View>

              {/* Topic */}
              <Text style={s.fieldLabel}>Topic (optional)</Text>
              <TextInput
                style={s.textInput}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Linked Lists - Insertion"
                placeholderTextColor={C.muted}
              />

              <TouchableOpacity
                style={s.primaryBtn}
                onPress={handleStartSession}
                activeOpacity={0.85}
              >
                <Text style={s.primaryBtnText}>Start Attendance Session</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <SectionHeading
                title="Session Live"
                subtitle="Students within Bluetooth range can mark attendance"
              />

              {/* BLE status chip */}
              <BleStatusChip advertising={advertising} />

              <InfoRow label="Subject" value={activeSubject?.subjectName} />
              <InfoRow label="Session Type" value={sessionType} />
              {sessionType === "Practical" && (
                <InfoRow label="Batch" value={section} />
              )}
              <InfoRow label="Period" value={lecturePeriod} />
              <InfoRow label="Topic" value={topic || "—"} />

              <Divider />

              {/* Timer */}
              <Text style={s.timerLabel}>Time remaining</Text>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 42,
                  fontWeight: "800",
                  color: timer < 60 ? C.danger : C.primary,
                  letterSpacing: -1,
                }}
              >
                {formatTimer(timer)}
              </Text>

              <TouchableOpacity
                style={s.dangerBtn}
                onPress={handleCloseSession}
                activeOpacity={0.85}
              >
                <Text style={s.dangerBtnText}>
                  ⏹ End Session &amp; Stop BLE
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ══════════════════════════════════════
            SECTION 2 — HISTORY
        ══════════════════════════════════════ */}
        <View style={s.card}>
          <SectionHeading
            title="Attendance History"
            subtitle={activeSubject?.subjectName}
          />

          {/* Summary tiles */}
          <View style={s.statsRow}>
            <StatTile label="Classes" value={summary.totalClasses} />
            <StatTile label="Present" value={summary.attended} accent />
            <StatTile label="Absent" value={summary.absent} />
          </View>
          <View style={s.rateRow}>
            <Text style={s.rateLabel}>Attendance Rate</Text>
            <Text
              style={[
                s.rateValue,
                {
                  color:
                    summary.rate >= 75
                      ? C.success
                      : summary.rate >= 50
                        ? C.warn
                        : C.danger,
                },
              ]}
            >
              {summary.rate}%
            </Text>
          </View>
          <ProgressBar value={summary.rate} />

          {summary.rate < 75 && summary.totalClasses > 0 && (
            <View style={s.warnBanner}>
              <Text style={s.warnText}>
                ⚠️ Class attendance is below 75%. Review absenteeism.
              </Text>
            </View>
          )}

          <Divider />

          {/* Filters */}
          <View style={s.filterRow}>
            <View style={[s.filterItem, { marginRight: 8 }]}>
              <Text style={s.filterLabel}>Month</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={filterMonth}
                  onValueChange={setFilterMonth}
                  style={s.picker}
                >
                  {MONTHS.map((m) => (
                    <Picker.Item
                      key={m.value}
                      label={m.label}
                      value={m.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={s.filterItem}>
              <Text style={s.filterLabel}>Type</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={filterType}
                  onValueChange={setFilterType}
                  style={s.picker}
                >
                  <Picker.Item label="All" value="all" />
                  {SESSION_TYPES.map((t) => (
                    <Picker.Item key={t} label={t} value={t} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Student filter */}
          {allStudents.length > 0 && (
            <>
              <Text style={s.filterLabel}>Student</Text>
              <View style={s.pickerWrap}>
                <Picker
                  selectedValue={filterStudent}
                  onValueChange={setFilterStudent}
                  style={s.picker}
                >
                  <Picker.Item label="All Students" value="all" />
                  {allStudents.map((st) => (
                    <Picker.Item
                      key={st._id}
                      label={`${st.name} (${st.roll})`}
                      value={st._id}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Divider />

          {/* Table */}
          {historyLoading ? (
            <ActivityIndicator
              color={C.accent}
              style={{ marginVertical: 20 }}
            />
          ) : history.length === 0 ? (
            <Text style={s.emptyText}>
              No records found for the selected filters.
            </Text>
          ) : (
            <>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeadCell, { flex: 1.8 }]}>Date</Text>
                <Text style={[s.tableHeadCell, { flex: 2.5 }]}>Student</Text>
                <Text
                  style={[s.tableHeadCell, { flex: 1.2, textAlign: "center" }]}
                >
                  Status
                </Text>
              </View>
              <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={renderHistoryRow}
                scrollEnabled={false}
              />
            </>
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
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE8E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.live,
    letterSpacing: 1,
  },
  bleChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  bleChipIcon: { fontSize: 16 },
  bleChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#1D3557",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
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
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoLabel: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    backgroundColor: "#FAFBFF",
  },
  pickerWrap: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: "#FAFBFF",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: C.text,
  },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderColor: C.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  dangerBtnText: {
    color: C.danger,
    fontWeight: "700",
    fontSize: 14,
  },
  timerLabel: {
    textAlign: "center",
    fontSize: 12,
    color: C.muted,
    marginTop: 6,
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: 6,
    borderRadius: 99,
  },
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
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    marginBottom: 4,
  },
  tableHeadCell: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accent,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: { backgroundColor: "#FAFBFF" },
  tableCell: {
    fontSize: 13,
    color: C.text,
  },
  emptyText: {
    textAlign: "center",
    color: C.muted,
    fontSize: 13,
    paddingVertical: 24,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statTile: {
    alignItems: "center",
    flex: 1,
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
    color: C.primary,
    fontWeight: "800",
  },
  warnBanner: {
    backgroundColor: "#FFF3E0",
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
  },
});
