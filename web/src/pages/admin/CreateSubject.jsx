import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const CreateSubject = () => {
  const [formData, setFormData] = useState({
    subjectName: "",
    subjectCode: "",
    subjectType: "",
    assignedTeacher: "",
  });
  const [department, setDepartment] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const adminId = localStorage.getItem("userID");

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    try {
      const res = await api.get(`/admin/department/${adminId}`);
      setDepartment(res.data);
      fetchTeachers(res.data._id);
    } catch (error) {
      console.error("Error fetching department:", error);
    }
  };

  const fetchTeachers = async (deptId) => {
    try {
      const res = await api.get(`/admin/department/teacher/${deptId}`);
      setTeachers(res.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/subjects/create", {
        ...formData,
        semester: department.semester,
        departmentId: department._id,
      });
      // Add success handling (e.g., toast or redirect)
    } catch (error) {
      console.error("Error creating subject:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Subject</h1>
          <p className="text-gray-500 text-sm mt-1">
            Add a new subject to the system
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Subject Name
              </label>
              <input
                type="text"
                name="subjectName"
                placeholder="e.g. Database Management Systems"
                value={formData.subjectName}
                onChange={handleChange}
                required
                className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>

            {/* Subject Code */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Subject Code
              </label>
              <input
                type="text"
                name="subjectCode"
                placeholder="e.g. CSE401"
                value={formData.subjectCode}
                onChange={handleChange}
                required
                className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>

            {/* Semester (Auto) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Semester
              </label>
              <input
                value={
                  department?.semester
                    ? `Semester ${department.semester}`
                    : "Loading..."
                }
                disabled
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Department (Auto) */}
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">
                Department
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 min-h-[42px] flex items-center">
                {department?.departmentName || "Loading..."}
              </div>
            </div>

            {/* Subject Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Subject Type
              </label>
              <select
                name="subjectType"
                value={formData.subjectType}
                onChange={handleChange}
                required
                className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white transition-all appearance-none"
                // style={{
                //   backgroundImage:
                //     "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                //   backgroundRepeat: "no-repeat",
                //   backgroundPosition: "right 1rem center",
                //   backgroundSize: "1em",
                // }}
              >
                <option value="">Select Type</option>
                <option value="Theory+Lab+Practical">
                  Theory + Lab + Practical
                </option>
                <option value="Theory+Lab">Theory + Lab</option>
                <option value="Theory">Theory</option>
                <option value="Lab+Practical">Lab + Practical</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Assign Teacher
              </label>
              <select
                name="assignedTeacher"
                value={formData.assignedTeacher}
                onChange={handleChange}
                required
                className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white transition-all appearance-none"
                // style={{
                //   backgroundImage:
                //     "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                //   backgroundRepeat: "no-repeat",
                //   backgroundPosition: "right 1rem center",
                //   backgroundSize: "1em",
                // }}
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.employeeId}
                    )
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-black text-white px-6 py-2.5 rounded-md font-medium hover:bg-gray-800 transition-colors active:scale-95"
            >
              Create Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubject;
