import { useEffect, useState } from "react";
import api from "../../api/axios";

const adminId = () => localStorage.getItem("userID");

// ── tiny reusable bits ───────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-100 rounded-xl shadow-sm ${className}`}
  >
    {children}
  </div>
);

const StatCard = ({ icon, label, value, sub, accent = "#3B5BDB" }) => (
  <Card className="p-5 flex items-start gap-4">
    <div
      className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0"
      style={{ background: accent + "18", color: accent }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </Card>
);

// ── Horizontal bar ───────────────────────────────────────────────────────────
const HBar = ({ pct, color = "#3B5BDB", h = "h-3" }) => (
  <div className={`w-full ${h} bg-gray-100 rounded-full overflow-hidden`}>
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

const rateColor = (r) =>
  r >= 75 ? "#10B981" : r >= 50 ? "#F59E0B" : "#EF4444";

// ── Donut (SVG) ──────────────────────────────────────────────────────────────
const Donut = ({ pct, size = 100, stroke = 10, color = "#3B5BDB", label }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
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
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
};

// ── Vertical bar chart (pure CSS) ────────────────────────────────────────────
const BarChart = ({ items, maxVal, labelKey, valueKey, colorFn }) => {
  const mx = maxVal || Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1 min-w-0"
        >
          <span className="text-[10px] font-bold text-gray-600">
            {item[valueKey]}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((item[valueKey] / mx) * 100, 4)}%`,
              background: colorFn ? colorFn(item) : "#3B5BDB",
              minHeight: 4,
            }}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">
            {item[labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [dept, setDept] = useState(null);
  const [att, setAtt] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const id = adminId();
        const [dRes, aRes, anRes] = await Promise.all([
          api.get(`/admin/department/${id}`),
          api.get(`/admin/attendance-overview/${id}`),
          api.get(`/admin/analytics/${id}`),
        ]);
        setDept(dRes.data);
        setAtt(aRes.data);
        setAnalytics(anRes.data);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading dashboard…
      </div>
    );

  const s = att?.summary || {};
  const ov = analytics?.overview || {};

  // ── CGPA Distribution buckets ──
  const cgpaBuckets = { "9–10": 0, "7–9": 0, "5–7": 0, "<5": 0, "N/A": 0 };
  (analytics?.students || []).forEach((st) => {
    const c = st.latestCgpa;
    if (c <= 0) cgpaBuckets["N/A"]++;
    else if (c >= 9) cgpaBuckets["9–10"]++;
    else if (c >= 7) cgpaBuckets["7–9"]++;
    else if (c >= 5) cgpaBuckets["5–7"]++;
    else cgpaBuckets["<5"]++;
  });
  const cgpaItems = Object.entries(cgpaBuckets).map(([label, count]) => ({
    label,
    count,
  }));

  // ── Attendance Distribution buckets ──
  const attBuckets = { "≥90%": 0, "75–90%": 0, "50–75%": 0, "<50%": 0 };
  (att?.studentBreakdown || []).forEach((st) => {
    const r = st.rate;
    if (r >= 90) attBuckets["≥90%"]++;
    else if (r >= 75) attBuckets["75–90%"]++;
    else if (r >= 50) attBuckets["50–75%"]++;
    else attBuckets["<50%"]++;
  });
  const attItems = Object.entries(attBuckets).map(([label, count]) => ({
    label,
    count,
  }));

  // ── At-risk students (sorted by attendance asc) ──
  const atRisk = (analytics?.students || [])
    .filter(
      (st) =>
        st.attendanceRate < 75 || (st.latestCgpa > 0 && st.latestCgpa < 5),
    )
    .sort((a, b) => a.attendanceRate - b.attendanceRate)
    .slice(0, 8);

  // ── Subject attendance for bar chart ──
  const subjectAtt = (att?.subjectBreakdown || []).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {dept?.departmentName || "Department"} · Semester{" "}
          {dept?.semester || "—"} · {dept?.academicBatch || ""}
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👨‍🎓"
          label="Students"
          value={ov.totalStudents ?? dept?.subjects?.length ?? 0}
        />
        <StatCard
          icon="👨‍🏫"
          label="Teachers"
          value={dept?.teachers?.length ?? 0}
          accent="#6366F1"
        />
        <StatCard
          icon="📚"
          label="Subjects"
          value={dept?.subjects?.length ?? 0}
          accent="#0EA5E9"
        />
        <StatCard
          icon="📋"
          label="Sessions"
          value={s.totalSessions}
          accent="#F59E0B"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📊"
          label="Overall Attendance"
          value={`${s.overallRate || 0}%`}
          accent="#10B981"
        />
        <StatCard
          icon="📈"
          label="Avg CGPA"
          value={ov.avgCgpa || "—"}
          accent="#8B5CF6"
        />
        <StatCard
          icon="⚠️"
          label="At Risk"
          value={ov.atRiskCount ?? 0}
          sub="Att < 75% or CGPA < 5"
          accent="#EF4444"
        />
        <StatCard
          icon="🎓"
          label="Year / Semester"
          value={`Y${dept?.departmentYear || "—"} / S${dept?.semester || "—"}`}
          accent="#14B8A6"
        />
      </div>

      {/* ── Row: Donuts ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance donut */}
        <Card className="p-5 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide self-start">
            Attendance Rate
          </p>
          <Donut
            pct={s.overallRate || 0}
            size={120}
            stroke={12}
            color={rateColor(s.overallRate || 0)}
            label={`${s.overallRate || 0}% Overall`}
          />
          <div className="flex gap-6 text-xs text-gray-500 mt-1">
            <span>
              Present:{" "}
              <span className="font-bold text-emerald-600">
                {s.totalPresent}
              </span>
            </span>
            <span>
              Absent:{" "}
              <span className="font-bold text-red-500">{s.totalAbsent}</span>
            </span>
          </div>
        </Card>

        {/* CGPA distribution */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            CGPA Distribution
          </p>
          <BarChart
            items={cgpaItems}
            maxVal={Math.max(...cgpaItems.map((i) => i.count), 1)}
            labelKey="label"
            valueKey="count"
            colorFn={(item) => {
              const l = item.label;
              if (l === "9–10") return "#10B981";
              if (l === "7–9") return "#6366F1";
              if (l === "5–7") return "#F59E0B";
              if (l === "<5") return "#EF4444";
              return "#D1D5DB";
            }}
          />
        </Card>

        {/* Attendance distribution */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Attendance Distribution
          </p>
          <BarChart
            items={attItems}
            maxVal={Math.max(...attItems.map((i) => i.count), 1)}
            labelKey="label"
            valueKey="count"
            colorFn={(item) => {
              const l = item.label;
              if (l === "≥90%") return "#10B981";
              if (l === "75–90%") return "#6366F1";
              if (l === "50–75%") return "#F59E0B";
              return "#EF4444";
            }}
          />
        </Card>
      </div>

      {/* ── Row: Subject attendance + At-risk list ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject-wise attendance */}
        <Card className="p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Subject-wise Attendance
          </p>
          {subjectAtt.length > 0 ? (
            <div className="space-y-3">
              {subjectAtt.map((sub, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-800 truncate max-w-[60%]">
                      {sub.subjectName}
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: rateColor(sub.rate) }}
                    >
                      {sub.rate}%
                    </span>
                  </div>
                  <HBar pct={sub.rate} color={rateColor(sub.rate)} h="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data yet.</p>
          )}
        </Card>

        {/* At-risk students */}
        <Card className="overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              ⚠️ At-Risk Students
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Attendance &lt; 75% or CGPA &lt; 5
            </p>
          </div>
          {atRisk.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-2 text-left font-semibold">Name</th>
                    <th className="px-5 py-2 text-left font-semibold">Roll</th>
                    <th className="px-5 py-2 text-left font-semibold">CGPA</th>
                    <th className="px-5 py-2 text-left font-semibold">Att %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atRisk.map((st) => (
                    <tr key={st._id} className="hover:bg-red-50/40 transition">
                      <td className="px-5 py-2.5 font-medium text-gray-800">
                        {st.name}
                      </td>
                      <td className="px-5 py-2.5 text-gray-500">
                        {st.rollNumber}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`font-bold ${st.latestCgpa > 0 && st.latestCgpa < 5 ? "text-red-500" : "text-gray-700"}`}
                        >
                          {st.latestCgpa > 0 ? st.latestCgpa.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className="font-bold"
                          style={{ color: rateColor(st.attendanceRate) }}
                        >
                          {st.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 pb-5 text-sm text-gray-400">
              No at-risk students — great job! 🎉
            </p>
          )}
        </Card>
      </div>

      {/* ── Row: Subject scores + Recent sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject score overview */}
        <Card className="p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Subject Score Overview (out of 145)
          </p>
          {(analytics?.subjects || []).length > 0 ? (
            <div className="space-y-3">
              {analytics.subjects.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {sub.subjectName}
                    </p>
                    <HBar
                      pct={(sub.avgScore / 145) * 100}
                      color={
                        sub.avgScore >= 100
                          ? "#10B981"
                          : sub.avgScore >= 70
                            ? "#F59E0B"
                            : "#EF4444"
                      }
                      h="h-1.5"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-900">
                      {sub.avgScore}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      H:{sub.highScore} L:{sub.lowScore}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No scores yet.</p>
          )}
        </Card>

        {/* Recent sessions */}
        <Card className="overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Recent Attendance Sessions
            </p>
          </div>
          {(att?.recentSessions || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-2 text-left font-semibold">Date</th>
                    <th className="px-5 py-2 text-left font-semibold">
                      Subject
                    </th>
                    <th className="px-5 py-2 text-left font-semibold">Type</th>
                    <th className="px-5 py-2 text-left font-semibold">P / T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {att.recentSessions.slice(0, 8).map((sess) => (
                    <tr key={sess._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">
                        {sess.date}
                      </td>
                      <td className="px-5 py-2.5 font-medium text-gray-800 truncate max-w-[140px]">
                        {sess.subjectName}
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            sess.sessionType === "Lecture"
                              ? "bg-blue-50 text-blue-600"
                              : sess.sessionType === "Practical"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {sess.sessionType}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-700 font-medium">
                        {sess.present}/{sess.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 pb-5 text-sm text-gray-400">No sessions yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
