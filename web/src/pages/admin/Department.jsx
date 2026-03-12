import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const Department = () => {
  const [department, setDepartment] = useState(null);
  const adminId = localStorage.getItem("adminId");

  useEffect(() => {
    fetchDepartment();
  }, []);

  const fetchDepartment = async () => {
    try {
      const res = await api.get(`/admin/department/${adminId}`);
      setDepartment(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(department.shortCode);
    alert("Department Code Copied!");
  };

  if (!department) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h2>Department Details</h2>

      {/* 🔹 Department Code */}
      <div style={styles.codeCard}>
        <div>
          <strong>Department Code:</strong> {department.shortCode}
        </div>
        <button onClick={copyCode} style={styles.copyBtn}>
          Copy
        </button>
      </div>

      {/* 🔹 Basic Info */}
      <div style={styles.infoCard}>
        <p>
          <strong>College:</strong> {department.collegeName}
        </p>
        <p>
          <strong>Degree:</strong> {department.degreeType}
        </p>
        <p>
          <strong>Department:</strong> {department.departmentName}
        </p>
        <p>
          <strong>Year:</strong> {department.departmentYear}
        </p>
        <p>
          <strong>Semester:</strong> {department.semester}
        </p>
        <p>
          <strong>Batch:</strong> {department.academicBatch}
        </p>

        <button style={styles.editBtn}>Edit Department</button>
      </div>

      {/* 🔹 HoD Info */}
      <div style={styles.hodCard}>
        <h3>Head of Department (HoD)</h3>
        <p>
          <strong>Name:</strong> {department.hod?.name || "Not Assigned"}
        </p>
        <p>
          <strong>Email:</strong> {department.hod?.email || "-"}
        </p>
        <p>
          <strong>Phone:</strong> {department.hod?.phone || "-"}
        </p>
      </div>

      {/* 🔹 Subjects Table */}
      <div style={styles.tableContainer}>
        <h3>Subjects & Teachers</h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Subject Name</th>
              <th>Subject Code</th>
              <th>Semester</th>
              <th>Teacher Name</th>
              <th>Teacher Email</th>
            </tr>
          </thead>
          <tbody>
            {department.subjects.length > 0 ? (
              department.subjects.map((sub, index) => (
                <tr key={index}>
                  <td>{sub.subjectName}</td>
                  <td>{sub.subjectCode}</td>
                  <td>{sub.semester}</td>
                  <td>{sub.teacher?.name || "Not Assigned"}</td>
                  <td>{sub.teacher?.email || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No Subjects Added Yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
  },
  codeCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#e0f2fe",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  copyBtn: {
    padding: "6px 12px",
    backgroundColor: "#1e40af",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  editBtn: {
    marginTop: "10px",
    padding: "8px 14px",
    backgroundColor: "#f59e0b",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  hodCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  tableContainer: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};

export default Department;
