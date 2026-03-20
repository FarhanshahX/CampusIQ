import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Analytics", path: "/admin/analytics" },
    { name: "Attendance", path: "/admin/attendance" },
    { name: "Department", path: "/admin/department" },
    { name: "Teachers", path: "/admin/teachers" },
    { name: "Subjects", path: "/admin/subjects" },
    { name: "Students", path: "/admin/students" },
    { name: "Announcements", path: "/admin/announcements" }, 
    { name: "Profile", path: "/admin/profile" },
    // { name: "Settings", path: "/admin/settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">CampusIQ</h1>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md text-sm font-medium transition
               ${
                 isActive
                   ? "bg-gray-100 text-gray-900"
                   : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
               }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
