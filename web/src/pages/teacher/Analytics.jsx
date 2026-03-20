import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/axios";

// ── Helpers (Premium UI Components) ──────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent = "#6366F1" }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
      style={{ background: accent + "15", color: accent }}
    >
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-gray-900 tracking-tight">
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs text-gray-400 font-medium mt-1">{sub}</p>}
    </div>
  </div>
);

const Bar = ({ pct, color = "#6366F1" }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700 ease-out"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

const RateBadge = ({ rate, good = 75, warn = 50 }) => {
  const color =
    rate >= good
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : rate >= warn
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : "text-red-700 bg-red-50 border-red-100";
  return (
    <span
      className={`text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${color}`}
    >
      {rate}%
    </span>
  );
};

const ScoreBadge = ({ score, max = 145 }) => {
  const pct = (score / max) * 100;
  const color =
    pct >= 70
      ? "text-indigo-700 bg-indigo-50 border-indigo-100"
      : pct >= 40
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : "text-red-700 bg-red-50 border-red-100";
  return (
    <span
      className={`text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${color}`}
    >
      {score}
    </span>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const Analytics = () => {
  const { user, activeSubject } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rollNumber"); // rollNumber | score | attendance | cgpa
  const [riskFilter, setRiskFilter] = useState("all"); // all | atRisk | safe
  const [selectedMetric, setSelectedMetric] = useState("attendance"); // attendance | ia | lab | theory

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

    // Search
    const q = search.toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q) ||
          s.registrationNumber?.toLowerCase().includes(q),
      );
    }

    // Risk Filter based on selectedMetric
    if (riskFilter === "atRisk") {
      list = list.filter((s) => {
        if (selectedMetric === "attendance") return s.attendanceRate < 75;
        if (selectedMetric === "ia") return s.internalTotal < 8;
        if (selectedMetric === "theory") return s.theory < 16;
        if (selectedMetric === "lab")
          return (
            s.experiments.filter((e) => e > 0).length +
              s.assignments.filter((a) => a > 0).length <
            6
          );
        return s.isAtRisk;
      });
    } else if (riskFilter === "safe") {
      list = list.filter((s) => {
        if (selectedMetric === "attendance") return s.attendanceRate >= 75;
        if (selectedMetric === "ia") return s.internalTotal >= 8;
        if (selectedMetric === "theory") return s.theory >= 16;
        if (selectedMetric === "lab")
          return (
            s.experiments.filter((e) => e > 0).length +
              s.assignments.filter((a) => a > 0).length >=
            6
          );
        return !s.isAtRisk;
      });
    }

    // Sort
    switch (sortBy) {
      case "score":
        list.sort((a, b) => b.totalMarks - a.totalMarks);
        break;
      case "attendance":
        list.sort((a, b) => b.attendanceRate - a.attendanceRate);
        break;
      case "cgpa":
        list.sort((a, b) => b.latestCgpa - a.latestCgpa);
        break;
      default:
        list.sort((a, b) =>
          (a.rollNumber || "").localeCompare(b.rollNumber || ""),
        );
    }

    return list;
  }, [data, search, riskFilter, sortBy, selectedMetric]);

  if (!activeSubject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 text-3xl shadow-sm">
          📊
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Analytics unavailable
        </h2>
        <p className="text-gray-500 max-w-sm mt-3 font-medium">
          Please select a subject from your Profile to view detailed performance
          insights.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          Gathering Insights...
        </p>
      </div>
    );
  }

  const ov = data?.overview || {};

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-widest">
              Subject Insights
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            {activeSubject.subjectName}
            <span className="text-gray-300 ml-3">
              {activeSubject.subjectCode}
            </span>
          </h1>
          <p className="text-gray-500 font-medium">
            Detailed student performance & risk analysis for this subject.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-95"
          title="Refresh Data"
        >
          <svg
            className="w-5 h-5"
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

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="👥"
          label="Total Students"
          value={ov.totalStudents}
          sub="Enrolled in subject"
        />
        <StatCard
          icon="🎯"
          label="Avg IA Marks"
          value={ov.avgInternalTotal}
          sub="Out of 20"
          accent="#6366F1"
        />
        <StatCard
          icon="📈"
          label="Avg Attendance"
          value={ov.avgAttendanceRate ? `${ov.avgAttendanceRate}%` : "—"}
          sub="Session participation"
          accent="#10B981"
        />
        <StatCard
          icon="⚠️"
          label="At Risk"
          value={
            data?.students?.filter((s) => {
              if (selectedMetric === "attendance") return s.attendanceRate < 75;
              if (selectedMetric === "ia") return s.internalTotal < 8; // 40% of 20
              if (selectedMetric === "theory") return s.theory < 16; // 40% of 40 (assuming theory is out of 100/scaled, or just some threshold)
              if (selectedMetric === "lab")
                return (
                  s.experiments.filter((e) => e > 0).length +
                    s.assignments.filter((a) => a > 0).length <
                  6
                );
              return s.isAtRisk;
            }).length
          }
          sub={`Based on ${selectedMetric.toUpperCase()}`}
          accent="#EF4444"
        />
      </div>

      {/* Logic Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            id: "attendance",
            label: "Attendance",
            icon: "📈",
            color: "#10B981",
          },
          {
            id: "ia",
            label: "Internal Assessment",
            icon: "📝",
            color: "#6366F1",
          },
          { id: "lab", label: "Lab / Practical", icon: "⚗️", color: "#F59E0B" },
          { id: "theory", label: "Theory Exam", icon: "📚", color: "#8B5CF6" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              selectedMetric === m.id
                ? "bg-white border-indigo-500 shadow-md scale-[1.02]"
                : "bg-gray-50/50 border-transparent hover:border-gray-200"
            }`}
          >
            <span className="text-2xl">{m.icon}</span>
            <span
              className={`text-xs font-black uppercase tracking-widest ${selectedMetric === m.id ? "text-indigo-600" : "text-gray-400"}`}
            >
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search students..."
                className="text-black pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-10 relative"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1em",
              }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rollNumber">Sort: Roll Number</option>
              <option value="score">Sort: Subject Score ↓</option>
              <option value="attendance">Sort: Attendance ↓</option>
              <option value="cgpa">Sort: Latest CGPA ↓</option>
            </select>

            <select
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-10 relative"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1em",
              }}
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="atRisk">⚠️ At Risk Only</option>
              <option value="safe">✅ Safe Only</option>
            </select>
          </div>

          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            {filteredStudents.length} Students Showing
          </span>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                    <th className="px-8 py-5">Student Details</th>
                    <th className="px-8 py-5">Roll Number</th>
                    <th className="px-8 py-5">Section</th>
                    <th className="px-8 py-5">Latest CGPA</th>
                    <th className="px-8 py-5 text-right">
                      {selectedMetric === "attendance" && "Attendance"}
                      {selectedMetric === "ia" && "Internal Assessment"}
                      {selectedMetric === "lab" && "Lab Progress"}
                      {selectedMetric === "theory" && "Theory Marks"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map((st) => {
                    // Risk calculation for highlighting row
                    let rowAtRisk = st.isAtRisk;
                    if (selectedMetric === "attendance")
                      rowAtRisk = st.attendanceRate < 75;
                    if (selectedMetric === "ia")
                      rowAtRisk = st.internalTotal < 8;
                    if (selectedMetric === "theory") rowAtRisk = st.theory < 16;
                    if (selectedMetric === "lab")
                      rowAtRisk =
                        st.experiments.filter((e) => e > 0).length +
                          st.assignments.filter((a) => a > 0).length <
                        6;

                    // CGPA Color Coding
                    const cgpaColor =
                      st.latestCgpa < 6
                        ? "text-red-700 bg-red-50 border-red-100"
                        : st.latestCgpa < 7
                          ? "text-orange-700 bg-orange-50 border-orange-100"
                          : st.latestCgpa < 8.5
                            ? "text-blue-700 bg-blue-50 border-blue-100"
                            : "text-emerald-700 bg-emerald-50 border-emerald-100";

                    return (
                      <tr
                        key={st._id}
                        className={`hover:bg-indigo-50/30 transition-colors duration-200 group ${
                          rowAtRisk ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                                rowAtRisk
                                  ? "bg-red-100 text-red-600"
                                  : "bg-indigo-100 text-indigo-600"
                              }`}
                            >
                              {st.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                {st.name}
                                {rowAtRisk && (
                                  <span
                                    className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                                    title="At Risk"
                                  />
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                Reg: {st.registrationNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-gray-500">
                          {st.rollNumber}
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            {st.section}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${cgpaColor}`}
                          >
                            {st.latestCgpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {selectedMetric === "attendance" && (
                            <div className="flex flex-col gap-2 min-w-[120px] ml-auto max-w-[160px]">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                <span className="text-gray-400">
                                  {st.attended}/{st.totalSessions || 0}
                                </span>
                                <span
                                  className={
                                    st.attendanceRate >= 75
                                      ? "text-emerald-500"
                                      : "text-red-500"
                                  }
                                >
                                  {st.attendanceRate}%
                                </span>
                              </div>
                              <Bar
                                pct={st.attendanceRate}
                                color={
                                  st.attendanceRate >= 75
                                    ? "#10B981"
                                    : "#EF4444"
                                }
                              />
                            </div>
                          )}
                          {selectedMetric === "ia" && (
                            <ScoreBadge
                              score={st.internalTotal.toFixed(2)}
                              max={20}
                            />
                          )}
                          {selectedMetric === "theory" && (
                            <ScoreBadge score={st.theory.toFixed(2)} max={40} />
                          )}
                          {selectedMetric === "lab" && (
                            <div className="flex flex-col gap-3 ml-auto max-w-[200px]">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                  <span>Experiments</span>
                                  <span>
                                    {st.experiments.filter((v) => v > 0).length}
                                    /10
                                  </span>
                                </div>
                                <Bar
                                  pct={
                                    (st.experiments.filter((v) => v > 0)
                                      .length /
                                      10) *
                                    100
                                  }
                                  color="#F59E0B"
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                  <span>Assignments</span>
                                  <span>
                                    {st.assignments.filter((v) => v > 0).length}
                                    /2
                                  </span>
                                </div>
                                <Bar
                                  pct={
                                    (st.assignments.filter((v) => v > 0)
                                      .length /
                                      2) *
                                    100
                                  }
                                  color="#6366F1"
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4 text-2xl">
              🔍
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              No students found
            </h3>
            <p className="text-gray-400 font-medium">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
