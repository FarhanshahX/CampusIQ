import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";

const adminId = () => localStorage.getItem("userID");

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Tiny bar (pure CSS) ──────────────────────────────────────────────────────
const Bar = ({ pct, color = "#3B5BDB" }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

// ─── Rate badge ───────────────────────────────────────────────────────────────
const RateBadge = ({ rate }) => {
  const color =
    rate >= 75
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : rate >= 50
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded border ${color}`}
    >
      {rate}%
    </span>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Attendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); // overview | students | sessions
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(
          `/admin/attendance-overview/${adminId()}`,
        );
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── filtered lists ──
  const filteredStudents = useMemo(() => {
    if (!data?.studentBreakdown) return [];
    const q = search.toLowerCase();
    return data.studentBreakdown.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q),
    );
  }, [data, search]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading attendance data…
      </div>
    );

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Department-wide attendance overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="📋"
          label="Total Sessions"
          value={s.totalSessions}
        />
        <StatCard
          icon="✅"
          label="Total Present"
          value={s.totalPresent}
          accent="#10B981"
        />
        <StatCard
          icon="❌"
          label="Total Absent"
          value={s.totalAbsent}
          accent="#EF4444"
        />
        <StatCard
          icon="📊"
          label="Overall Rate"
          value={`${s.overallRate}%`}
          accent="#6366F1"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1 text-xs font-medium gap-1 w-fit">
        {[
          ["overview", "Subject Overview"],
          ["students", "Student Breakdown"],
          ["sessions", "Recent Sessions"],
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

      {/* ─── Tab: Subject Overview ─── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {data?.subjectBreakdown?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.subjectBreakdown.map((sub, i) => (
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
                        {sub.subjectCode} · {sub.sessions} session
                        {sub.sessions !== 1 && "s"}
                      </p>
                    </div>
                    <RateBadge rate={sub.rate} />
                  </div>
                  <Bar
                    pct={sub.rate}
                    color={
                      sub.rate >= 75
                        ? "#10B981"
                        : sub.rate >= 50
                          ? "#F59E0B"
                          : "#EF4444"
                    }
                  />
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      Present:{" "}
                      <span className="font-semibold text-gray-700">
                        {sub.present}
                      </span>
                    </span>
                    <span>
                      Absent:{" "}
                      <span className="font-semibold text-gray-700">
                        {sub.absent}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
              No attendance sessions recorded yet.
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Student Breakdown ─── */}
      {tab === "students" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by name or roll number…"
            className="w-full sm:w-80 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                        Attended
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left font-semibold w-40">
                        &nbsp;
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((st) => (
                      <tr
                        key={st._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {st.name}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {st.rollNumber}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {st.section}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {st.attended}/{st.totalSessions}
                        </td>
                        <td className="px-6 py-3">
                          <RateBadge rate={st.rate} />
                        </td>
                        <td className="px-6 py-3">
                          <Bar
                            pct={st.rate}
                            color={
                              st.rate >= 75
                                ? "#10B981"
                                : st.rate >= 50
                                  ? "#F59E0B"
                                  : "#EF4444"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
              {search
                ? "No students match your search."
                : "No student attendance records yet."}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Recent Sessions ─── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          {data?.recentSessions?.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3 text-left font-semibold">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Present / Total
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Topic
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentSessions.map((sess) => (
                      <tr
                        key={sess._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                          {sess.date}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {sess.subjectName}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {sess.teacherName}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                              sess.sessionType === "Lecture"
                                ? "bg-blue-50 text-blue-600 border border-blue-200"
                                : sess.sessionType === "Practical"
                                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {sess.sessionType}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {sess.present}/{sess.total}
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-xs truncate max-w-[200px]">
                          {sess.topic || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 text-sm shadow-sm">
              No sessions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
