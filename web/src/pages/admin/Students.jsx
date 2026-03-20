import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const fileInputRef = useRef(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [departmentId, setDepartmentId] = useState("");

  const adminID = localStorage.getItem("userID");

  const fetchStudents = async () => {
    const res = await api.get("/admin/students");
    setStudents(res.data);
  };
  const fetchDepartment = async (adminID) => {
    const res = await api.get(`/admin/department/${adminID}`);
    setDepartmentId(res.data._id);
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartment(adminID);
  }, []);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/student/upload/${departmentId}`, formData);

      alert("Students uploaded successfully");
      setIsUploaded(true);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "Registration Number,Official Email,Full Name\n" +
      "2023ad45f,2023ad45f@sigce.edu.in,Farhan Shah\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "student_template.csv";
    link.click();
  };

  const columns = [
    { key: "registrationNumber", label: "Registration Number" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "rollNumber", label: "Roll No" },
    { key: "department.departmentName", label: "Department" },
    { key: "department.semester", label: "Semester" },
    { key: "section", label: "Lab Batch" },
  ];

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">
            Add and manage student records
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Hidden File Input */}
          <input
            type="file"
            accept=".xlsx,.csv"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />

          {/* Upload / Edit Button */}
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
          >
            {isUploaded ? "Edit Student’s Info" : "Upload Student’s Data"}
          </button>

          {/* Download Template Button */}
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition"
          >
            Download Sample Template
          </button>
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Student List
        </h2>
        <Table columns={columns} data={students} />
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      {...props}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
    />
  </div>
);

export default Students;
