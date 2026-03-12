// import { NavLink } from "react-router-dom";

// const TeacherSidebar = () => {
//   return (
//     <aside className="w-64 bg-white border-r border-gray-200 px-4 py-6">
//       {/* <h2 className="text-lg font-semibold tracking-tight mb-8">CampusIQ</h2> */}
//       <div className="h-16 flex items-center px-3 border-b border-gray-200">
//         <h1 className="text-lg font-semibold text-gray-900">CampusIQ</h1>
//       </div>

//       <nav className="space-y-2 text-sm">
//         <NavItem to="/teacher/dashboard">Dashboard</NavItem>
//         <NavItem to="/teacher/classes">My Classes</NavItem>
//         <NavItem to="/teacher/students">Students</NavItem>
//         <NavItem to="/teacher/analytics">Analytics</NavItem>
//       </nav>
//     </aside>
//   );
// };

// const NavItem = ({ to, children }) => (
//   <NavLink
//     to={to}
//     className={({ isActive }) =>
//       `block px-3 py-2 rounded-md ${
//         isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
//       }`
//     }
//   >
//     {children}
//   </NavLink>
// );

// export default TeacherSidebar;

import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { name: "Dashboard", path: "/teacher" },
    { name: "My Classes", path: "/teacher/myclasses" },
    { name: "Students", path: "/teacher/students" },
    { name: "Analytics", path: "/teacher/analytics" },
    { name: "Settings", path: "/teacher/settings" },
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
            end={item.path === "/teacher"}
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
