import { useState, useEffect } from "react";
import api from "../../api/axios";

const CreateTeacher = () => {
  const [department, setDepartment] = useState(null);

  const adminId = localStorage.getItem("userID");

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    const res = await api.get(`/admin/department/${adminId}`);
    setDepartment(res.data);
    setForm((prev) => ({ ...prev, department: res.data._id }));
  };

  const [form, setForm] = useState({
    fisrtName: "",
    lastName: "",
    employeeId: "",
    email: "",
    designation: "",
    department: "",
  });

  const formStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    boxShadow: "",
    height: "100vh",
    width: "100%",
  };

  const designations = [
    "Head of Department",
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Lecturer",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/admin/create-teacher", form);
      alert(
        `Teacher created successfully.\nTemporary Password: ${res.data.tempPassword}`,
      );
      setForm({
        fisrtName: "",
        lastName: "",
        employeeId: "",
        email: "",
        designation: "",
        department: department._id,
      });
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating teacher");
    }
  };

  return (
    <div style={formStyle} className="space-y-10">
      {/* FORM */}
      <div
        style={{ width: "50%", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)" }}
        className="bg-white border border-gray-200 rounded-xl p-8 max-w-3xl"
      >
        <h1 className="text-lg font-semibold text-gray-900">Create Teacher</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a new teacher to the system
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5"
          style={{ color: "#000000" }}
        >
          <Input name="firstName" label="First Name" onChange={handleChange} />
          <Input name="lastName" label="Last Name" onChange={handleChange} />
          <Input
            name="employeeId"
            label="Employee ID"
            onChange={handleChange}
          />
          <Input name="email" label="Official Email" onChange={handleChange} />
          <select
            name="designation"
            label="Designation"
            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            onChange={handleChange}
          >
            <option value="">Select Designation</option>
            {designations.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <Input
            name="department"
            value={department?.departmentName || "Loading..."}
            label="Department"
            readOnly
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              className="mt-4 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
            >
              Create Teacher
            </button>
          </div>
        </form>
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
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
    />
  </div>
);

export default CreateTeacher;
