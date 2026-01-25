import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);

  const fetchTeachers = async () => {
    const res = await api.get("/admin/teachers");
    setTeachers(res.data);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "employeeId", label: "Employee ID" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500">
            Manage teacher accounts and assignments
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/teachers/create")}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
        >
          Add Teacher
        </button>
      </div>

      {/* TABLE */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Teachers</h2>
        <Table columns={columns} data={teachers} />
      </div>
    </div>
  );
};

export default Teachers;
