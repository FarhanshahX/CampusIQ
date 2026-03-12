import { Navigate } from "react-router-dom";

const CreateDepartmentRoute = ({ children }) => {
  const firstTime = localStorage.getItem("firstTime");

  if (firstTime === "false") {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
};

export default CreateDepartmentRoute;
