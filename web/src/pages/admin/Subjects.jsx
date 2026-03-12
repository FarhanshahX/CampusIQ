import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);

  const adminId = localStorage.getItem("userID");

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    try {
      const res = await api.get(`/admin/department/${adminId}`);
      fetchSubjects(res.data._id);
    } catch (error) {
      console.error("Error fetching department:", error);
    }
  };

  const fetchSubjects = async (deptID) => {
    const res = await api.get(`/subjects/${deptID}`);
    console.log(res);
    setSubjects(res.data);
  };

  const columns = [
    { key: "subjectCode", label: "Subject Code" },
    { key: "subjectName", label: "Subject Name" },
    { key: "semester", label: "Semester" },
    { key: "department.departmentName", label: "Department" },
    { key: "subjectType", label: "Subject Type" },
    { key: "assignedTeacher.firstName", label: "Assigned Professor" },
    { key: "assignedTeacher.email", label: "Professor's Email" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500">Create and Manage subjects</p>
        </div>

        <button
          onClick={() => navigate("/admin/subjects/create")}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
        >
          Create Subject
        </button>
      </div>

      {/* TABLE */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h2>
        <Table columns={columns} data={subjects} />
      </div>
    </div>
  );
};

export default Subjects;
