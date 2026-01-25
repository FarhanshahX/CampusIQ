import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user.name}</p>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/admin/create-teacher">➕ Create Teacher</Link>
      </div>

      <button onClick={logout} style={{ marginTop: "2rem" }}>
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
