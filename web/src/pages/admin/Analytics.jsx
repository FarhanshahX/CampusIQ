import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";

const adminId = () => localStorage.getItem("userID");

// ── helpers ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, accent = "#3B5BDB" }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
    <div
      className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0"
      style={{ background: accent + "18", color: accent }}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Bar = ({ pct, color = "#3B5BDB" }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

const RateBadge = ({ rate, good = 75, warn = 50 }) => {
  const color =
    rate >= good
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : rate >= warn
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${color}`}>
      {rate}%
    </span>
  );
};

const CgpaBadge = ({ cgpa }) => {
  const color =
    cgpa >= 8
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : cgpa >= 5
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : cgpa > 0
          ? "text-red-700 bg-red-50 border-red-200"
          : "text-gray-400 bg-gray-50 border-gray-200";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${color}`}>
      {cgpa > 0 ? cgpa.toFixed(2) : "N/A"}
    </span>
  );
};

// ── Student Detail Modal ─────────────────────────────────────────────────────
const StudentDetail = ({ student, onClose }) => {
  if (!student) return null;
  const semesters = student.cgpa || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{student.name}</h2>
            <p className="text-xs text-gray-400">
              {student.rollNumber} · Section {student.section}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              CGPA
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {student.latestCgpa > 0 ? student.latestCgpa.toFixed(2) : "N/A"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Attendance
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {student.attendanceRate}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Total Marks
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {student.totalMarks}
            </p>
          </div>
        </div>

        {/* CGPA Trend */}
        {semesters.some((c) => c > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              CGPA Trend (Sem 1–8)
            </h3>
            <div className="flex items-end gap-2 h-24">
              {semesters.map((c, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: `${c > 0 ? (c / 10) * 100 : 2}%`,
                      background:
                        c >= 8
                          ? "#10B981"
                          : c >= 5
                            ? "#F59E0B"
                            : c > 0
                              ? "#EF4444"
                              : "#E5E7EB",
                      minHeight: 4,
                    }}
                  />
                  <span className="text-[9px] text-gray-400">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Scores */}
        {student.subjectScores?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Subject Scores
            </h3>
            <div className="space-y-2">
              {student.subjectScores.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {sc.subjectName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {sc.subjectCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {sc.totalMarks}/145
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Int:{sc.internalTotal} Exp:{sc.experimentTotal} Assi:
                      {sc.assignmentTotal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rollNumber"); // rollNumber | cgpa | attendance | totalMarks
  const [sectionFilter, setSectionFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all"); // all | atRisk | safe
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tab, setTab] = useState("students"); // students | subjects

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/admin/analytics/${adminId()}`);
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // sections for filter
  const sections = useMemo(() => {
    if (!data?.students) return [];
    return [
      ...new Set(data.students.map((s) => s.section).filter(Boolean)),
    ].sort();
  }, [data]);

  // filtered + sorted students
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    let list = [...data.students];

    // search
    const q = search.toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q),
      );
    }

    // section filter
    if (sectionFilter !== "all") {
      list = list.filter((s) => s.section === sectionFilter);
    }

    // risk filter
    if (riskFilter === "atRisk") {
      list = list.filter((s) => s.attendanceRate < 75 || s.latestCgpa < 5);
    } else if (riskFilter === "safe") {
      list = list.filter(
        (s) =>
          (s.attendanceRate >= 75 || s.totalSessions === 0) &&
          (s.latestCgpa >= 5 || s.latestCgpa === 0),
      );
    }

    // sort
    switch (sortBy) {
      case "cgpa":
        list.sort((a, b) => b.latestCgpa - a.latestCgpa);
        break;
      case "attendance":
        list.sort((a, b) => b.attendanceRate - a.attendanceRate);
        break;
      case "totalMarks":
        list.sort((a, b) => b.totalMarks - a.totalMarks);
        break;
      default:
        list.sort((a, b) =>
          (a.rollNumber || "").localeCompare(b.rollNumber || ""),
        );
    }

    return list;
  }, [data, search, sectionFilter, riskFilter, sortBy]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading analytics…
      </div>
    );

  const ov = data?.overview || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Student academic performance &amp; insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="👨‍🎓" label="Total Students" value={ov.totalStudents} />
        <StatCard
          icon="📈"
          label="Avg CGPA"
          value={ov.avgCgpa || "—"}
          accent="#6366F1"
        />
        <StatCard
          icon="📊"
          label="Avg Attendance"
          value={`${ov.avgAttendanceRate}%`}
          accent="#10B981"
        />
        <StatCard
          icon="⚠️"
          label="At Risk"
          value={ov.atRiskCount}
          sub="Attendance < 75% or CGPA < 5"
          accent="#EF4444"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1 text-xs font-medium gap-1 w-fit">
        {[
          ["students", "Students"],
          ["subjects", "Subjects"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-md transition capitalize cursor-pointer ${
              tab === k
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Students Tab ─── */}
      {tab === "students" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search name or roll…"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="rollNumber">Sort: Roll Number</option>
              <option value="cgpa">Sort: CGPA ↓</option>
              <option value="attendance">Sort: Attendance ↓</option>
              <option value="totalMarks">Sort: Total Marks ↓</option>
            </select>

            {sections.length > 1 && (
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="all">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            )}

            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="atRisk">⚠️ At Risk Only</option>
              <option value="safe">✅ Safe Only</option>
            </select>

            <span className="text-xs text-gray-400 ml-auto">
              {filteredStudents.length} student
              {filteredStudents.length !== 1 && "s"}
            </span>
          </div>

          {/* Table */}
          {filteredStudents.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3 text-left font-semibold">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Total Marks
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        &nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((st) => {
                      const isAtRisk =
                        st.attendanceRate < 75 ||
                        (st.latestCgpa > 0 && st.latestCgpa < 5);
                      return (
                        <tr
                          key={st._id}
                          className={`hover:bg-gray-50 transition cursor-pointer ${
                            isAtRisk ? "bg-red-50/40" : ""
                          }`}
                          onClick={() => setSelectedStudent(st)}
                        >
                          <td className="px-6 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {isAtRisk && (
                                <span className="text-red-400 text-xs">⚠️</span>
                              )}
                              {st.name}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-500">
                            {st.rollNumber}
                          </td>
                          <td className="px-6 py-3 text-gray-500">
                            {st.section}
                          </td>
                          <td className="px-6 py-3">
                            <CgpaBadge cgpa={st.latestCgpa} />
                          </td>
                          <td className="px-6 py-3">
                            <RateBadge rate={st.attendanceRate} />
                          </td>
                          <td className="px-6 py-3 text-gray-700 font-medium">
                            {st.totalMarks}
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-xs text-blue-600 hover:underline">
                              View →
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
              No students match your filters.
            </div>
          )}
        </div>
      )}

      {/* ─── Subjects Tab ─── */}
      {tab === "subjects" && (
        <div className="space-y-4">
          {data?.subjects?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.subjects.map((sub, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {sub.subjectName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {sub.subjectCode} · {sub.students} student
                        {sub.students !== 1 && "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {sub.avgScore}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase">
                        Avg Score
                      </p>
                    </div>
                  </div>
                  <Bar
                    pct={(sub.avgScore / 145) * 100}
                    color={
                      sub.avgScore >= 100
                        ? "#10B981"
                        : sub.avgScore >= 70
                          ? "#F59E0B"
                          : "#EF4444"
                    }
                  />
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      High:{" "}
                      <span className="font-semibold text-emerald-600">
                        {sub.highScore}
                      </span>
                    </span>
                    <span>
                      Low:{" "}
                      <span className="font-semibold text-red-500">
                        {sub.lowScore}
                      </span>
                    </span>
                    <span>
                      Avg:{" "}
                      <span className="font-semibold text-gray-700">
                        {sub.avgScore}
                      </span>
                      /145
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
              No subject score data available yet.
            </div>
          )}
        </div>
      )}

      {/* Student detail modal */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default Analytics;
