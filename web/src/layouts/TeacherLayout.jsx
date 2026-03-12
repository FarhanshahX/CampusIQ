import Sidebar from "../components/teacher/Sidebar";
import Topbar from "../components/teacher/Topbar";
import { Outlet } from "react-router-dom";

const TeacherLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
