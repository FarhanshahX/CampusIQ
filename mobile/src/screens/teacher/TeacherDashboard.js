import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import TeacherHeader from "../../components/TeacherHeader";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// ── Reusable Premium Components ──────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const StatCard = ({ icon, label, value, sub, accent = "#6366F1" }) => (
  <Card style={styles.statCard}>
    <View style={[styles.iconCircle, { backgroundColor: accent + "15" }]}>
      <Text style={[styles.iconText, { color: accent }]}>{icon}</Text>
    </View>
    <View style={styles.statInfo}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  </Card>
);

const ProgressBar = ({ pct, color = "#6366F1", height = 4 }) => (
  <View style={[styles.progressBg, { height }]}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.min(pct, 100)}%`, backgroundColor: color },
      ]}
    />
  </View>
);

const rateColor = (r) =>
  r >= 75 ? "#10B981" : r >= 50 ? "#F59E0B" : "#EF4444";

const Donut = ({ pct, size = 120, stroke = 12, color = "#6366F1", label }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <View style={styles.donutContainer}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#F3F4F6"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Text style={styles.donutLabel}>{label}</Text>
    </View>
  );
};

const BarChart = ({ items, maxVal, labelKey, valueKey, colorFn }) => {
  const mx = maxVal || Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <View style={styles.barChartContainer}>
      {items.map((item, i) => (
        <View key={i} style={styles.barItem}>
          <Text style={styles.barCount}>{item[valueKey]}</Text>
          <View
            style={[
              styles.barFill,
              {
                height: `${Math.max((item[valueKey] / mx) * 80, 5)}%`,
                backgroundColor: colorFn ? colorFn(item) : "#6366F1",
              },
            ]}
          />
          <Text style={styles.barLabel}>{item[labelKey]}</Text>
        </View>
      ))}
    </View>
  );
};

// ── Main Dashboard Screen ───────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user, activeSubject } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    if (activeSubject && user) {
      fetchDashboardData();
    }
  }, [activeSubject, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/teacher/analytics/${user._id}/${activeSubject._id}`,
      );
      setData(res.data);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const scoreBuckets = useMemo(() => {
    const b = { "17-20": 0, "12-17": 0, "8-12": 0, "<8": 0 };
    (data?.students || []).forEach((s) => {
      const m = s.internalTotal || 0;
      if (m >= 17) b["17-20"]++;
      else if (m >= 12) b["12-17"]++;
      else if (m >= 8) b["8-12"]++;
      else b["<8"]++;
    });
    return Object.entries(b).map(([label, count]) => ({ label, count }));
  }, [data]);

  const attBuckets = useMemo(() => {
    const b = { "≥90%": 0, "75–90%": 0, "40–75%": 0, "<40%": 0 };
    (data?.students || []).forEach((s) => {
      const r = s.attendanceRate || 0;
      if (r >= 90) b["≥90%"]++;
      else if (r >= 75) b["75–90%"]++;
      else if (r >= 40) b["40–75%"]++;
      else b["<40%"]++;
    });
    return Object.entries(b).map(([label, count]) => ({ label, count }));
  }, [data]);

  const atRiskStudents = useMemo(() => {
    return (data?.students || [])
      .filter((s) => s.isAtRisk)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 5);
  }, [data]);

  const atRiskCount = useMemo(() => {
    if (!data?.students) return 0;
    return data.students.filter((s) => (s.internalTotal || 0) < 8).length;
  }, [data]);

  if (!activeSubject) {
    return (
      <View style={styles.flexCenter}>
        <TeacherHeader />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>Welcome to CampusIQ</Text>
          <Text style={styles.emptySub}>
            Please select your active subject in the Profile page to view your
            teaching dashboard.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={styles.flexCenter}>
        <TeacherHeader />
        <ActivityIndicator
          size="large"
          color="#6366F1"
          style={{ marginTop: 100 }}
        />
        <Text style={styles.loaderText}>Assembling your dashboard...</Text>
      </View>
    );
  }

  const ov = data?.overview || {};

  return (
    <View style={styles.container}>
      <TeacherHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTag}>TEACHING OVERVIEW</Text>
          <Text style={styles.headerTitle}>{activeSubject.subjectName}</Text>
          <Text style={styles.headerCode}>{activeSubject.subjectCode}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.row}>
            <StatCard
              icon="👥"
              label="STUDENTS"
              value={ov.totalStudents}
              accent="#6366F1"
            />
            <StatCard
              icon="🎯"
              label="AVG IA MARKS"
              value={ov.avgInternalTotal}
              sub="out of 20"
              accent="#8B5CF6"
            />
          </View>
          <View style={styles.row}>
            <StatCard
              icon="📈"
              label="ATTENDANCE"
              value={`${ov.avgAttendanceRate}%`}
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

        {/* Visuals */}
        <Card style={styles.visualCard}>
          <Text style={styles.cardTitle}>Overall Attendance</Text>
          <Donut
            pct={ov.avgAttendanceRate || 0}
            size={140}
            stroke={14}
            color={rateColor(ov.avgAttendanceRate || 0)}
            label={`${ov.avgAttendanceRate || 0}% Subject Rate`}
          />
          <View style={styles.donutStats}>
            <View style={styles.smallStat}>
              <Text style={styles.smallStatValue}>
                {ov.avgAttendanceRate >= 75 ? "Healthy" : "Low"}
              </Text>
              <Text style={styles.smallStatLabel}>STATUS</Text>
            </View>
            <View style={styles.smallStat}>
              <Text style={[styles.smallStatValue, { color: "#10B981" }]}>
                ≥75%
              </Text>
              <Text style={styles.smallStatLabel}>TARGET</Text>
            </View>
          </View>
        </Card>

        <View style={styles.distributionContainer}>
          <Card style={[styles.visualCard, { marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Score Distribution</Text>
            <BarChart
              items={scoreBuckets}
              labelKey="label"
              valueKey="count"
              colorFn={(item) => {
                if (item.label === "17-20") return "#10B981";
                if (item.label === "12-17") return "#6366F1";
                if (item.label === "8-12") return "#F59E0B";
                return "#EF4444";
              }}
            />
          </Card>
        </View>

        <Card style={[styles.visualCard, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>Attendance Distribution</Text>
          <BarChart
            items={attBuckets}
            labelKey="label"
            valueKey="count"
            colorFn={(item) => {
              if (item.label === "≥90%") return "#10B981";
              if (item.label === "75–90%") return "#6366F1";
              if (item.label === "40–75%") return "#F59E0B";
              return "#EF4444";
            }}
          />
        </Card>

        {/* Recent Sessions */}
        <Card style={styles.listCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Sessions</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LAST 8 CLOSED</Text>
            </View>
          </View>
          {(data?.recentSessions || []).length > 0 ? (
            data.recentSessions.slice(0, 8).map((sess) => (
              <View key={sess._id} style={styles.sessionItem}>
                <View style={styles.sessionMain}>
                  <Text style={styles.sessionDate}>{sess.date}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          sess.sessionType === "Lecture"
                            ? "#DBEAFE"
                            : "#F3E8FF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        {
                          color:
                            sess.sessionType === "Lecture"
                              ? "#2563EB"
                              : "#9333EA",
                        },
                      ]}
                    >
                      {sess.sessionType}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sessionTopic} numberOfLines={1}>
                  {sess.topic || "—"}
                </Text>
                <View style={styles.sessionAttendance}>
                  <View style={styles.attInfo}>
                    <Text style={styles.attCount}>
                      {sess.present}/{sess.total}
                    </Text>
                    <Text style={styles.attPercent}>
                      {Math.round((sess.present / sess.total) * 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    pct={(sess.present / sess.total) * 100}
                    color={rateColor((sess.present / sess.total) * 100)}
                  />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No sessions recorded yet.</Text>
            </View>
          )}
        </Card>

        {/* At-Risk Students */}
        <Card style={[styles.listCard, { marginBottom: 40 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: "#EF4444" }]}>
              ⚠️ At-Risk Students
            </Text>
            <View style={[styles.badge, { backgroundColor: "#FEF2F2" }]}>
              <Text style={[styles.badgeText, { color: "#EF4444" }]}>
                IMMEDIATE REVIEW
              </Text>
            </View>
          </View>
          {atRiskStudents.length > 0 ? (
            atRiskStudents.map((st) => (
              <View key={st._id} style={styles.atRiskItem}>
                <View style={styles.atRiskAvatar}>
                  <Text style={styles.avatarText}>{st.name.charAt(0)}</Text>
                </View>
                <View style={styles.atRiskMeta}>
                  <Text style={styles.atRiskName}>{st.name}</Text>
                  <Text style={styles.atRiskRoll}>{st.rollNumber}</Text>
                </View>
                <View style={styles.atRiskStats}>
                  <Text style={styles.riskAttLabel}>ATT</Text>
                  <Text style={styles.riskAttValue}>{st.attendanceRate}%</Text>
                  <Text style={styles.riskScoreValue}>
                    {st.internalTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.successText}>
                🎉 All students are doing well!
              </Text>
            </View>
          )}
          {atRiskStudents.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => {
                navigation.navigate("AnalyticsScreen");
              }}
            >
              <Text style={styles.viewAllText}>VIEW FULL ANALYTICS →</Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },
  statInfo: { marginLeft: 12, flex: 1 },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 20, fontWeight: "900", color: "#1E293B" },
  statSub: { fontSize: 8, color: "#94A3B8", fontWeight: "700", marginTop: 1 },

  // Cards
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  visualCard: { padding: 20 },
  cardTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  // Donut
  donutContainer: { alignItems: "center", marginVertical: 10 },
  donutLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 12,
  },
  donutStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#F8FAFC",
    paddingTop: 16,
    marginTop: 16,
    width: "100%",
  },
  smallStat: { alignItems: "center" },
  smallStatValue: { fontSize: 13, fontWeight: "900", color: "#1E293B" },
  smallStatLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: 2,
  },

  // Bar Chart
  barChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingHorizontal: 4,
  },
  barItem: { flex: 1, alignItems: "center", marginHorizontal: 4 },
  barCount: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 4,
  },
  barFill: { width: "100%", borderRadius: 8, minHeight: 4 },
  barLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },

  // Lists
  listCard: { marginTop: 24, paddingVertical: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 9, fontWeight: "900", color: "#94A3B8" },

  sessionItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  sessionMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sessionDate: { fontSize: 13, fontWeight: "900", color: "#1E293B" },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: "900" },
  sessionTopic: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 12,
  },
  sessionAttendance: { gap: 6 },
  attInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  attCount: { fontSize: 11, fontWeight: "900", color: "#1E293B" },
  attPercent: { fontSize: 10, fontWeight: "800", color: "#64748B" },

  atRiskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  atRiskAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "900", color: "#EF4444" },
  atRiskMeta: { flex: 1, marginLeft: 12 },
  atRiskName: { fontSize: 14, fontWeight: "900", color: "#1E293B" },
  atRiskRoll: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  atRiskStats: { alignItems: "flex-end" },
  riskAttLabel: { fontSize: 8, fontWeight: "800", color: "#94A3B8" },
  riskAttValue: { fontSize: 13, fontWeight: "900", color: "#EF4444" },
  riskScoreValue: { fontSize: 11, fontWeight: "800", color: "#1E293B" },

  viewAllBtn: { padding: 16, alignItems: "center" },
  viewAllText: { fontSize: 10, fontWeight: "900", color: "#94A3B8" },

  // Helpers
  progressBg: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  loaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noDataContainer: { padding: 40, alignItems: "center" },
  noDataText: { fontSize: 14, fontWeight: "700", color: "#94A3B8" },
  successText: { fontSize: 14, fontWeight: "800", color: "#10B981" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  emptySub: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
});
