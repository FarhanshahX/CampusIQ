import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import CreateDepartment from "./pages/admin/CreateDepartment";
import AdminDashboard from "./pages/admin/Dashboard";
import Department from "./pages/admin/Department";
import Subjects from "./pages/admin/Subjects";
import Settings from "./pages/admin/Settings";
import Teachers from "./pages/admin/Teachers";
import Students from "./pages/admin/Students";
import CreateTeacher from "./pages/admin/CreateTeacher";
import CreateStudent from "./pages/admin/CreateStudent";
import CreateSubject from "./pages/admin/CreateSubject";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import AdminAttendance from "./pages/admin/Attendance";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminProfile from "./pages/admin/Profile";
import AdminAnalytics from "./pages/admin/Analytics";
import TeacherAnalytics from "./pages/teacher/Analytics";
import TeacherProfile from "./pages/teacher/Profile";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherScoresEntering from "./pages/teacher/ScoresEntering";
import TeacherResources from "./pages/teacher/Resources";
import TeacherAnnouncements from "./pages/teacher/Announcements";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/create-department" element={<CreateDepartment />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="students" element={<Students />} />
          <Route path="department" element={<Department />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route
          path="/admin/teachers/create"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <CreateTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects/create"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <CreateSubject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/create"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <CreateStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={["TEACHER"]}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="scoresentering" element={<TeacherScoresEntering />} />
          <Route path="resources" element={<TeacherResources />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
          <Route path="profile" element={<TeacherProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
