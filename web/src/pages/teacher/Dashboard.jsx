import StatCard from "../../components/StatCard";

const TeacherDashboard = () => {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Teacher Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your academic responsibilities
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Classes" value="4" />
        <StatCard title="Students" value="126" />
        <StatCard title="Assignments" value="12" />
        <StatCard title="Pending Reviews" value="7" />
      </div>

      {/* PLACEHOLDERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Recent Activity"
          text="Recent submissions, attendance updates, and announcements will appear here."
        />
        <Card
          title="Student Performance Snapshot"
          text="Quick insights into student strengths and weak areas."
        />
      </div>
    </div>
  );
};

const Card = ({ title, text }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm">
    <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{text}</p>
  </div>
);

export default TeacherDashboard;
