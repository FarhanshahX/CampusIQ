import { useState } from "react";
import api from "../../api/axios";

const CreateStudent = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    department: "",
    year: "",
    semester: "",
    dateOfBirth: "",
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

  return (
    <div style={formStyle} className="space-y-10">
      {/* CREATE STUDENT */}
      <div
        style={{ width: "50%", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)" }}
        className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl"
      >
        <h1 className="text-lg font-semibold text-gray-900">Add Student</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5"
          style={{ color: "#000000" }}
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

export default CreateStudent;
