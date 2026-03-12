import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const CreateDepartment = () => {
  const [departmentName, setDepartmentName] = useState("");
  const [departmentYear, setDepartmentYear] = useState("");
  const [semester, setSemester] = useState("");
  const [academicBatch, setAcademicBatch] = useState("");
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const adminId = localStorage.getItem("userID");

  useEffect(() => {
    generateBatches();
  }, []);

  const generateBatches = () => {
    const currentYear = new Date().getFullYear();
    let batchList = [];

    for (let i = -4; i <= 1; i++) {
      const start = currentYear + i;
      const end = start + 4;
      batchList.push(`${start}-${end}`);
    }

    setBatches(batchList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departmentName || !departmentYear || !semester || !academicBatch) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("admin/create-department", {
        departmentName,
        departmentYear: Number(departmentYear),
        semester: Number(semester),
        academicBatch,
        adminId,
      });

      alert("Department Created Successfully");
      console.log(response.data);

      window.location.href = "/admin";
    } catch (error) {
      console.error(error);
      alert("Error creating department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Create Department</h2>

        <form onSubmit={handleSubmit}>
          {/* College Name */}
          <div style={styles.inputGroup}>
            <label>College Name</label>
            <input
              type="text"
              value="Smt. Indira Gandhi College of Engineering"
              disabled
              style={styles.input}
            />
          </div>

          {/* Degree Type */}
          <div style={styles.inputGroup}>
            <label>Degree / Program Type</label>
            <input
              type="text"
              value="Bachelors Of Engineering (B.E.)"
              disabled
              style={styles.input}
            />
          </div>

          {/* Department Name */}
          <div style={styles.inputGroup}>
            <label>Department Name</label>
            <select
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Department</option>
              <option>Artificial Intelligence & Data Science</option>
              <option>Artificial Intelligence & Machine Learning</option>
              <option>Computer Science Engineering</option>
              <option>Internet of Things</option>
              <option>Electrical Engineering</option>
              <option>Mechanical Engineering</option>
            </select>
          </div>

          {/* Department Year */}
          <div style={styles.inputGroup}>
            <label>Department Year</label>
            <select
              value={departmentYear}
              onChange={(e) => setDepartmentYear(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Year</option>
              <option value="1">F.E.</option>
              <option value="2">S.E.</option>
              <option value="3">T.E.</option>
              <option value="4">B.E.</option>
            </select>
          </div>

          {/* Semester */}
          <div style={styles.inputGroup}>
            <label>Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Semester</option>
              <option value="1">I</option>
              <option value="2">II</option>
              <option value="3">III</option>
              <option value="4">IV</option>
              <option value="5">V</option>
              <option value="6">VI</option>
              <option value="7">VII</option>
              <option value="8">VIII</option>
            </select>
          </div>

          {/* Academic Batch */}
          <div style={styles.inputGroup}>
            <label>Academic Year / Batch</label>
            <select
              value={academicBatch}
              onChange={(e) => setAcademicBatch(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Batch</option>
              {batches.map((batch, index) => (
                <option key={index} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Department"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    color: "#000000",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f9",
  },
  card: {
    width: "500px",
    padding: "30px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  heading: {
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  inputGroup: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1e40af",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default CreateDepartment;
