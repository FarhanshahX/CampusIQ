import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import Academics from "./pages/admin/Academics";
import Analytics from "./pages/admin/Analytics";
import AdminDashboard from "./pages/admin/Dashboard";
import Settings from "./pages/admin/Settings";
import Teachers from "./pages/admin/Teachers";
import Students from "./pages/admin/Students";
import CreateTeacher from "./pages/admin/CreateTeacher";
import CreateStudent from "./pages/admin/CreateStudent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

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
          <Route path="students" element={<Students />} />
          <Route path="academics" element={<Academics />} />
          <Route path="analytics" element={<Analytics />} />
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
          path="/admin/students/create"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <CreateStudent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
