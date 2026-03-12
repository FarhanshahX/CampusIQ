import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import CreateDepartment from "./pages/admin/CreateDepartment";
import AdminDashboard from "./pages/admin/Dashboard";
import Department from "./pages/admin/Department";
import Subjects from "./pages/admin/Subjects";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import Teachers from "./pages/admin/Teachers";
import Students from "./pages/admin/Students";
import CreateTeacher from "./pages/admin/CreateTeacher";
import CreateStudent from "./pages/admin/CreateStudent";
import CreateSubject from "./pages/admin/CreateSubject";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";

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
          {/* <Route path="myclasses" element={<MyClasses />} /> */}
          <Route path="students" element={<Students />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
