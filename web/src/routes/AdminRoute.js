import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const firstTime = localStorage.getItem("firstTime");

  if (!token) return <Navigate to="/admin/login" />;

  // If first time → block dashboard
  if (firstTime === "true") {
    return <Navigate to="/create-department" />;
  }

  return children;
};

export default AdminRoute;
