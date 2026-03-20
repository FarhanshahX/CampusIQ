import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { startContinuousScan } from "../../utils/BLEManager";

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
  warnBg: "#FFF3E0",
  text: "#1A1A2E",
  muted: "#6C757D",
  border: "#DDE3F0",
  live: "#E63946",
  disabled: "#B0BAC9",
};

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

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const pct = (a, t) => (t > 0 ? Math.round((a / t) * 100) : 0);

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
const Divider = () => <View style={s.divider} />;

const SectionHeading = ({ title, sub }) => (
  <View style={s.headingWrap}>
    <Text style={s.headingText}>{title}</Text>
    {sub ? <Text style={s.headingSub}>{sub}</Text> : null}
  </View>
);

const ProgressBar = ({ value }) => {
  const color = value >= 75 ? C.success : value >= 50 ? C.warn : C.danger;
  return (
    <View style={s.progressTrack}>
      <View
        style={[
          s.progressFill,
          { width: `${Math.min(value, 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
};

const Badge = ({ label }) => {
  const isPresent = label === "PRESENT";
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: isPresent ? C.successBg : C.dangerBg },
      ]}
    >
      <Text style={[s.badgeText, { color: isPresent ? C.success : C.danger }]}>
        {label}
      </Text>
    </View>
  );
};

const StatTile = ({ label, value, accent }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, accent && { color: C.accent }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────
// MARK ATTENDANCE CARD
// ─────────────────────────────────────────────
const MarkAttendanceCard = ({
  session,
  isInRange,
  scanning,
  onMark,
  marking,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const isPractical = session.sessionType === "Practical";

  return (
    <Animated.View
      style={[
        s.markCard,
        { opacity: fadeAnim },
        !isInRange && !scanning && s.markCardDisabled,
      ]}
    >
      {/* Header */}
      <View style={s.markCardHeader}>
        <View style={s.liveChip}>
          <Animated.View
            style={[s.liveDot, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={s.liveText}>LIVE</Text>
        </View>
        <Text style={s.markCardTime}>
          {formatTime(session.lectureStart)} – {formatTime(session.lectureEnd)}
        </Text>
      </View>

      {/* Subject + Teacher */}
      <Text style={s.markCardSubject}>{session.subject?.subjectName}</Text>
      <Text style={s.markCardTeacher}>
        Prof. {session.teacher?.firstName} {session.teacher?.lastName}
      </Text>

      {/* Session type & section pill */}
      <View style={s.sessionMetaRow}>
        <View style={s.sessionTypePill}>
          <Text style={s.sessionTypePillText}>{session.sessionType}</Text>
        </View>
        {isPractical && session.section && (
          <View
            style={[
              s.sessionTypePill,
              { backgroundColor: "#EEF2FF", marginLeft: 6 },
            ]}
          >
            <Text style={[s.sessionTypePillText, { color: C.accent }]}>
              Batch {session.section}
            </Text>
          </View>
        )}
      </View>

      {/* Topic */}
      {!!session.topic && (
        <Text style={s.markCardTopic}>📖 {session.topic}</Text>
      )}

      <Divider />

      {/* BLE scanning status */}
      {scanning && (
        <View style={s.scanningBox}>
          <ActivityIndicator size="small" color={C.accent} />
          <Text style={s.scanningText}>Scanning for teacher's device…</Text>
        </View>
      )}

      {/* CTA */}
      {!scanning &&
        (isInRange ? (
          <TouchableOpacity
            style={[s.markBtn, marking && s.markBtnLoading]}
            onPress={onMark}
            disabled={marking}
            activeOpacity={0.85}
          >
            {marking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.markBtnText}>✓ Mark Present</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={s.outOfRangeBox}>
            <Text style={s.outOfRangeIcon}>📡</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.outOfRangeTitle}>Out of Bluetooth Range</Text>
              <Text style={s.outOfRangeSub}>
                Move closer to the classroom. The app will re-check every 15
                seconds.
              </Text>
            </View>
          </View>
        ))}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function StudentAttendanceScreen() {
  const { user } = useAuth();

  // ── Active session ────────────────────────
  const [activeSession, setActiveSession] = useState(null);
  const [isInRange, setIsInRange] = useState(false);
  const [scanning, setScanning] = useState(false); // true during first BLE scan
  const [marking, setMarking] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  // Ref to hold the BLE scan cleanup function so we can cancel it on unmount
  // or when the session disappears.
  const stopScanRef = useRef(null);

  // ── Subjects & filters ────────────────────
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState(null);
  const [filterMonth, setFilterMonth] = useState("overall");

  // ── History ───────────────────────────────
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Summary ───────────────────────────────
  const [summary, setSummary] = useState({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    rate: 0,
  });

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchSubjects();
      checkActiveSession();
    }
  }, [user]);

  useEffect(() => {
    if (filterSubject) fetchHistory();
  }, [filterSubject, filterMonth]);

  // Re-check active session whenever history changes (to update alreadyMarked status)
  useEffect(() => {
    if (history.length > 0) {
      checkActiveSession();
    }
  }, [history]);

  // Stop BLE scanning on unmount
  useEffect(() => {
    return () => {
      if (stopScanRef.current) stopScanRef.current();
    };
  }, []);

  // ─────────────────────────────────────────
  // BLE SCANNING
  // ─────────────────────────────────────────
  /**
   * Called once we know which session is active.
   * Kicks off a continuous BLE scan that updates `isInRange` every ~15 s.
   */
  const startBLEScan = (bluetoothToken) => {
    // Cancel any previous scan
    if (stopScanRef.current) stopScanRef.current();

    setScanning(true);
    setIsInRange(false);

    // startContinuousScan fires the first scan immediately, then repeats.
    // We wrap setIsInRange so we can also clear the `scanning` spinner after
    // the very first result comes back.
    let firstResult = true;
    const wrappedSetter = (inRange) => {
      if (firstResult) {
        firstResult = false;
        setScanning(false);
      }
      setIsInRange(inRange);
    };

    const cleanup = startContinuousScan(
      bluetoothToken,
      wrappedSetter,
      15000, // re-scan every 15 s
      8000, // each scan times out after 8 s
    );

    stopScanRef.current = cleanup;
  };

  // ─────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────

  const departmentId = useAuth().user.departmentID;
  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects/${departmentId}`);
      setSubjects(res.data);
      if (res.data.length > 0) setFilterSubject(res.data[0]);
    } catch (e) {
      console.log("fetchSubjects:", e);
    }
  };

  /**
   * Fetches active sessions from the server and starts BLE scanning
   * for the relevant session's token.
   */
  const checkActiveSession = async () => {
    try {
      const res = await api.get("/attendance/active");
      const sessions = res.data;

      if (!sessions || sessions.length === 0) {
        setActiveSession(null);
        setIsInRange(false);
        if (stopScanRef.current) {
          stopScanRef.current();
          stopScanRef.current = null;
        }
        return;
      }

      // Filter by student's section for Practical sessions
      const relevant = sessions.find((sess) => {
        if (sess.sessionType === "Practical") {
          return sess.section === user.section;
        }
        return true;
      });

      setActiveSession(relevant || null);

      if (relevant) {
        // ── Check if already marked for this session ──────────────────────
        // We can check if this session's ID is present in our current history list
        // or just wait for the next history fetch. For better reliability,
        // we check the history array directly.
        const isMarked = history.some(
          (h) => h._id === relevant._id && h.status === "PRESENT",
        );
        if (isMarked) {
          setAlreadyMarked(true);
        } else {
          setAlreadyMarked(false);
          // ── Start real BLE scan for the session token ───────────────────
          startBLEScan(relevant.bluetoothToken);
        }
      } else {
        setAlreadyMarked(false);
        setIsInRange(false);
        if (stopScanRef.current) {
          stopScanRef.current();
          stopScanRef.current = null;
        }
      }
    } catch (e) {
      console.log("checkActiveSession:", e);
    }
  };

  const handleMarkAttendance = async () => {
    if (!activeSession || !isInRange) return;
    setMarking(true);
    try {
      await api.post("/attendance/mark", {
        sessionId: activeSession._id,
        studentId: user._id,
        bluetoothToken: activeSession.bluetoothToken,
        deviceId: user.deviceId, // hashed device fingerprint from app init
        user: user,
      });

      // Stop BLE scan — no longer needed after marking
      if (stopScanRef.current) {
        stopScanRef.current();
        stopScanRef.current = null;
      }

      setAlreadyMarked(true);
      Alert.alert(
        "Attendance Marked ✓",
        "You have been marked present for this session.",
      );
      fetchHistory();
    } catch (e) {
      const msg = e.response?.data?.message || "Could not mark attendance.";
      Alert.alert("Error", msg);
    } finally {
      setMarking(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!filterSubject) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: filterSubject._id });
      if (filterMonth !== "overall") params.append("month", filterMonth);
      params.append("userId", user._id);
      params.append("section", user.section);

      const res = await api.get(`/attendance/student-history?${params}`);
      setHistory(res.data.history || []);
      setSummary(
        res.data.summary || {
          totalClasses: 0,
          attended: 0,
          absent: 0,
          rate: 0,
        },
      );
    } catch (e) {
      console.log("fetchHistory:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [filterSubject, filterMonth]);

  // ─────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────
  const renderHistoryRow = ({ item, index }) => (
    <View style={[s.tableRow, index % 2 === 0 && s.tableRowAlt]}>
      <View style={s.dateBox}>
        <Text style={s.dateMonth}>{item.monthLabel}</Text>
        <Text style={s.dateDay}>{item.dayNum}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowSubject} numberOfLines={1}>
          {item.subjectName}
        </Text>
        <Text style={s.rowMeta}>
          {item.dayLabel} • {item.time} • {item.sessionType}
        </Text>
      </View>
      <Badge label={item.status} />
    </View>
  );

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* PAGE HEADER */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>My Attendance</Text>
          <Text style={s.pageSub}>Track your presence across all subjects</Text>
        </View>
      </View>

      {/* ══════════════════════════════════════
          SECTION 1 — MARK ATTENDANCE
      ══════════════════════════════════════ */}
      {activeSession && !alreadyMarked && (
        <MarkAttendanceCard
          session={activeSession}
          isInRange={isInRange}
          scanning={scanning}
          onMark={handleMarkAttendance}
          marking={marking}
        />
      )}

      {activeSession && alreadyMarked && (
        <View style={s.alreadyMarkedCard}>
          <Text style={s.alreadyMarkedIcon}>✅</Text>
          <View>
            <Text style={s.alreadyMarkedTitle}>Attendance Marked</Text>
            <Text style={s.alreadyMarkedSub}>
              You're marked present for this session.
            </Text>
          </View>
        </View>
      )}

      {!activeSession && (
        <View style={s.card}>
          <Text style={s.emptyText}>
            📭 No active session right now.{"\n"}Your teacher hasn't started one
            yet.
          </Text>
        </View>
      )}

      {/* ══════════════════════════════════════
          SECTION 2 — HISTORY
      ══════════════════════════════════════ */}
      <View style={s.card}>
        <SectionHeading
          title="Attendance History"
          sub={filterSubject?.subjectName || ""}
        />

        {/* Summary */}
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
              ⚠️ Your attendance is below 75%. You may be debarred from exams if
              this continues.
            </Text>
          </View>
        )}

        <Divider />

        {/* Filters */}
        <View style={s.filterRow}>
          <View style={[s.filterItem, { marginRight: 8 }]}>
            <Text style={s.filterLabel}>Subject</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={filterSubject?._id || ""}
                onValueChange={(val) =>
                  setFilterSubject(subjects.find((s) => s._id === val) || null)
                }
                style={s.picker}
              >
                {subjects.map((sub) => (
                  <Picker.Item
                    key={sub._id}
                    label={sub.subjectName}
                    value={sub._id}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={s.filterItem}>
            <Text style={s.filterLabel}>Month</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={filterMonth}
                onValueChange={setFilterMonth}
                style={s.picker}
              >
                {MONTHS.map((m) => (
                  <Picker.Item key={m.value} label={m.label} value={m.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <Divider />

        {/* Table */}
        {historyLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} />
        ) : history.length === 0 ? (
          <Text style={s.emptyText}>No records found.</Text>
        ) : (
          <>
            <View style={s.tableHeader}>
              <View style={s.dateBoxPlaceholder} />
              <Text style={[s.tableHeadCell, { flex: 1 }]}>Subject</Text>
              <Text
                style={[s.tableHeadCell, { width: 70, textAlign: "right" }]}
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

  // ── Mark Attendance Card ─────────────────
  markCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#D0E4F7",
  },
  markCardDisabled: {
    opacity: 0.8,
  },
  markCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  markCardTime: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "500",
  },
  markCardSubject: {
    fontSize: 20,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  markCardTeacher: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 10,
  },
  sessionMetaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  sessionTypePill: {
    backgroundColor: "#FEF3E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionTypePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.warn,
    letterSpacing: 0.3,
  },
  markCardTopic: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 4,
  },

  // Scanning spinner row
  scanningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    justifyContent: "center",
  },
  scanningText: {
    fontSize: 13,
    color: C.accent,
    fontWeight: "600",
  },

  markBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  markBtnLoading: { opacity: 0.7 },
  markBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  outOfRangeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  outOfRangeIcon: { fontSize: 22 },
  outOfRangeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
  },
  outOfRangeSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },

  // ── Already Marked ────────────────────────
  alreadyMarkedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.successBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#B7E4C7",
  },
  alreadyMarkedIcon: { fontSize: 28 },
  alreadyMarkedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.success,
  },
  alreadyMarkedSub: {
    fontSize: 12,
    color: C.success,
    opacity: 0.8,
    marginTop: 2,
  },

  // ── Card ─────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: C.primary,
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
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#F0F4FF",
    borderRadius: 8,
    marginBottom: 2,
  },
  tableHeadCell: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accent,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dateBoxPlaceholder: {
    width: 46,
    marginRight: 12,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: "#FAFBFF",
    borderRadius: 6,
  },
  dateBox: {
    width: 46,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 10,
    color: C.accent,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: C.primary,
    lineHeight: 22,
  },
  rowSubject: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  rowMeta: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  emptyText: {
    textAlign: "center",
    color: C.muted,
    fontSize: 13,
    paddingVertical: 24,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
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
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 99,
  },
  warnBanner: {
    backgroundColor: C.warnBg,
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
    lineHeight: 17,
  },
});
