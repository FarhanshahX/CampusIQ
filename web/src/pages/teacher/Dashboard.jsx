import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

// ── Reusable Premium Components ──────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}
  >
    {children}
  </div>
);

const StatCard = ({ icon, label, value, sub, accent = "#6366F1" }) => (
  <Card className="p-6 flex items-start gap-4">
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
      style={{ background: accent + "15", color: accent }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-gray-900 tracking-tight truncate">
        {value ?? "—"}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
          {sub}
        </p>
      )}
    </div>
  </Card>
);

const HBar = ({ pct, color = "#6366F1", h = "h-2" }) => (
  <div className={`w-full ${h} bg-gray-100 rounded-full overflow-hidden`}>
    <div
      className="h-full rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

const rateColor = (r) =>
  r >= 75 ? "#10B981" : r >= 50 ? "#F59E0B" : "#EF4444";

const Donut = ({ pct, size = 120, stroke = 12, color = "#6366F1", label }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
};

const BarChart = ({ items, maxVal, labelKey, valueKey, colorFn }) => {
  const mx = maxVal || Math.max(...items.map((i) => i[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-3 h-32 mt-4 px-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-2 min-w-0 group"
        >
          <span className="text-[10px] font-black text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
            {item[valueKey] || 0}
          </span>
          <div
            className="w-full rounded-t-xl transition-all duration-700 ease-out cursor-help"
            style={{
              height: `${Math.max(((item[valueKey] || 0) / mx) * 100, 8)}%`,
              backgroundColor: colorFn ? colorFn(item) : "#6366F1",
            }}
            title={`${item[labelKey]}: ${item[valueKey] || 0}`}
          />
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter truncate w-full text-center">
            {item[labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard Component ─────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user, activeSubject } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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
    const b = { "17–20": 0, "12–17": 0, "8–12": 0, "<8": 0 };
    (data?.students || []).forEach((s) => {
      const m = s.internalTotal || 0;
      if (m >= 17) b["17–20"]++;
      else if (m >= 12) b["12–17"]++;
      else if (m >= 8) b["8–12"]++;
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
      .slice(0, 6);
  }, [data]);

  const atRiskCount = useMemo(() => {
    if (!data?.students) return 0;
    return data.students.filter((s) => (s.internalTotal || 0) < 8).length;
  }, [data]);

  if (!activeSubject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-indigo-100">
          🏫
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Welcome to CampusIQ
        </h2>
        <p className="text-gray-500 max-w-sm mt-3 font-medium">
          Please select your active subject from the Profile page to view your
          teaching dashboard.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Assembling Insights...
        </p>
      </div>
    );
  }

  const ov = data?.overview || {};

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-200">
              Teaching Overview
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            {activeSubject.subjectName}
            <span className="text-gray-300 ml-3 font-medium">
              {activeSubject.subjectCode}
            </span>
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Real-time analytics and performance tracking for your active
            subject.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:text-indigo-600 transition-all active:scale-95 group"
        >
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="👥"
          label="Total Students"
          value={ov.totalStudents}
          sub="Enrolled"
        />
        <StatCard
          icon="🎯"
          label="Avg IA Marks"
          value={ov.avgInternalTotal}
          sub="Out of 20"
          accent="#8B5CF6"
        />
        <StatCard
          icon="📈"
          label="Avg Attendance"
          value={ov.avgAttendanceRate ? `${ov.avgAttendanceRate}%` : "—"}
          sub="Participation"
          accent="#10B981"
        />
        <StatCard
          icon="⚠️"
          label="At Risk"
          value={atRiskCount}
          sub="Based on IA < 8"
          accent="#EF4444"
        />
      </div>

      {/* ROW 1: Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-8 flex flex-col items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest self-start mb-6">
            Overall Attendance
          </p>
          <Donut
            pct={ov.avgAttendanceRate || 0}
            size={160}
            stroke={16}
            color={rateColor(ov.avgAttendanceRate || 0)}
            label={`${ov.avgAttendanceRate || 0}% Subject Rate`}
          />
          <div className="w-full flex justify-between gap-4 mt-8 pt-6 border-t border-gray-50">
            <div className="text-center">
              <p className="text-xs font-black text-gray-900">
                {ov.avgAttendanceRate >= 75 ? "Healthy" : "Low"}
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Status
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-emerald-600">≥75%</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Target
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-8 lg:col-span-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
            Score Distribution
          </p>
          <BarChart
            items={scoreBuckets}
            labelKey="label"
            valueKey="count"
            colorFn={(item) => {
              if (item.label === "17–20") return "#10B981";
              if (item.label === "12–17") return "#6366F1";
              if (item.label === "8–12") return "#F59E0B";
              return "#EF4444";
            }}
          />
        </Card>

        <Card className="p-8 lg:col-span-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
            Attendance Distribution
          </p>
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
      </div>

      {/* ROW 2: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Recent Attendance Sessions
            </h3>
            <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[9px] font-black rounded-lg border border-gray-100 uppercase tracking-widest">
              Last 8 Closed
            </span>
          </div>
          {(data?.recentSessions || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Type</th>
                    <th className="px-8 py-4">Topic</th>
                    <th className="px-8 py-4 text-right">Participation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentSessions.slice(0, 8).map((sess) => (
                    <tr
                      key={sess._id}
                      className="hover:bg-indigo-50/20 transition-colors group"
                    >
                      <td className="px-8 py-4 text-[11px] font-black text-gray-900">
                        {sess.date}
                      </td>
                      <td className="px-8 py-4">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                            sess.sessionType === "Lecture"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : sess.sessionType === "Practical"
                                ? "bg-purple-50 text-purple-600 border-purple-100"
                                : "bg-gray-50 text-gray-500 border-gray-100"
                          }`}
                        >
                          {sess.sessionType}
                        </span>
                      </td>
                      <td
                        className="px-8 py-4 text-[11px] font-medium text-gray-500 truncate max-w-[120px]"
                        title={sess.topic}
                      >
                        {sess.topic || "—"}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-black text-gray-900">
                            {sess.present}/{sess.total}
                          </span>
                          <div className="w-16">
                            <HBar
                              pct={(sess.present / sess.total) * 100}
                              color={rateColor(
                                (sess.present / sess.total) * 100,
                              )}
                              h="h-1"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-gray-300">
                No attendance sessions yet.
              </p>
            </div>
          )}
        </Card>

        {/* At-Risk Students */}
        <Card>
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-red-500 animate-pulse">●</span> At-Risk
              Students
            </h3>
            <span className="px-2 py-1 bg-red-50 text-red-500 text-[9px] font-black rounded-lg border border-red-100 uppercase tracking-widest">
              Immediate Review
            </span>
          </div>
          {atRiskStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-8 py-4">Student</th>
                    <th className="px-8 py-4">Roll</th>
                    <th className="px-8 py-4 text-right">Attendance</th>
                    <th className="px-8 py-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atRiskStudents.map((st) => (
                    <tr
                      key={st._id}
                      className="hover:bg-red-50/20 transition-colors group"
                    >
                      <td className="px-8 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black">
                          {st.name.charAt(0)}
                        </div>
                        <span className="text-[11px] font-black text-gray-900">
                          {st.name}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-[11px] font-bold text-gray-400">
                        {st.rollNumber}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-[11px] font-black text-red-600">
                          {st.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span
                          className={`text-[11px] font-black ${st.internalTotal < 8 ? "text-red-600" : "text-gray-900"}`}
                        >
                          {st.internalTotal.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center">
                <button
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  onClick={() => navigate("/teacher/analytics")}
                >
                  View Full Analytics →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-2">
                <span>🎉</span> All students are performing well!
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
