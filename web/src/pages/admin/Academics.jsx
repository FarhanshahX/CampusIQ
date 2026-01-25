const Academics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Academics</h1>
        <p className="text-sm text-gray-500">
          Configure departments, subjects, and academic structure
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900">Departments</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage academic departments.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900">Subjects</h3>
          <p className="mt-1 text-sm text-gray-500">
            Define subjects and map them to departments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Academics;
