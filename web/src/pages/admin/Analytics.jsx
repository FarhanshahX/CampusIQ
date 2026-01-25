const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">
          Institutional performance and trends
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500">Average Attendance</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">—%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500">At-Risk Students</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">—</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500">Active Teachers</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">—</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
