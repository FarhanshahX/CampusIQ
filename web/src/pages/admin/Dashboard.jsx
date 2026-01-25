import StatCard from "../../components/StatCard";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">
          Institutional summary and system status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Students" value="—" />
        <StatCard title="Teachers" value="—" />
        <StatCard title="Departments" value="—" />
        <StatCard title="Active Subjects" value="—" />
      </div>
    </div>
  );
};

export default Dashboard;
