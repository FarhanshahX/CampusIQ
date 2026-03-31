const Student = require("../models/Student.js");

const createStudent = async (req, res) => {
  const { name, email, rollNumber, department, year, semester, dateOfBirth } =
    req.body;

  const exists = await Student.findOne({
    $or: [{ email }, { rollNumber }],
  });

  if (exists) {
    return res.status(400).json({ message: "Student already exists" });
  }

  const student = await Student.create({
    name,
    email,
    rollNumber,
    department,
    year,
    semester,
    dateOfBirth,
  });

  res.status(201).json(student);
};

const Admin = require("../models/Admin.js");

const getStudents = async (req, res) => {
  const userId = req.query.adminID || req.query.userId;
  let query = {};

  if (userId) {
    const Admin = require("../models/Admin.js");
    const Teacher = require("../models/Teacher.js");

    let user = await Admin.findById(userId);
    if (!user) {
      user = await Teacher.findById(userId);
    }

    if (user && user.department) {
      query.department = user.department;
    }
  }

  const students = await Student.find(query).populate(
    "department",
    "departmentName semester",
  );
  res.json(students);
};

const getStudentbyID = async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId).populate(
      "department",
      "departmentName semester",
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching student" });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentbyID,
};
