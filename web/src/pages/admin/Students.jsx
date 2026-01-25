import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";

const Students = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    department: "",
    year: "",
    semester: "",
    dateOfBirth: "",
  });

  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    const res = await api.get("/admin/students");
    setStudents(res.data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/create-student", form);
      setForm({
        name: "",
        email: "",
        rollNumber: "",
        department: "",
        year: "",
        semester: "",
        dateOfBirth: "",
      });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding student");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "rollNumber", label: "Roll No" },
    { key: "department", label: "Department" },
    { key: "year", label: "Year" },
    { key: "semester", label: "Semester" },
    { key: "status", label: "Status" },
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

        <button
          onClick={() => navigate("/admin/students/create")}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
        >
          Add Student
        </button>
      </div>

      {/* CREATE STUDENT */}
      {/* <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl">
        <h2 className="text-lg font-semibold text-gray-900">Add Student</h2>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <Input label="Full Name" name="name" onChange={handleChange} />
          <Input label="Email" name="email" onChange={handleChange} />
          <Input
            label="Roll Number"
            name="rollNumber"
            onChange={handleChange}
          />
          <Input label="Department" name="department" onChange={handleChange} />
          <Input
            label="Year"
            name="year"
            type="number"
            onChange={handleChange}
          />
          <Input
            label="Semester"
            name="semester"
            type="number"
            onChange={handleChange}
          />
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            onChange={handleChange}
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              className="mt-4 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
            >
              Add Student
            </button>
          </div>
        </form>
      </div> */}

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
