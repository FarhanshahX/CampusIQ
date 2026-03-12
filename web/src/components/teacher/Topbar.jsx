import { useAuth } from "../../auth/useAuth";

const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: Page title (static for now) */}
      <h2 className="text-sm font-medium text-gray-700">Teacher Dashboard</h2>

      {/* Right: Profile */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>

        <button
          onClick={logout}
          className="text-sm text-white-500 hover:text-white-900 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
