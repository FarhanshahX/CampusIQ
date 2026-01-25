const Settings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">System preferences and security</p>
      </div>

      {/* Settings Sections */}
      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-900">Academic Year</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure academic year and semester dates.
          </p>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-900">Grading Scheme</h3>
          <p className="mt-1 text-sm text-gray-500">
            Define grading scales and evaluation rules.
          </p>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-900">Security</h3>
          <p className="mt-1 text-sm text-gray-500">
            Change password and manage access policies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
