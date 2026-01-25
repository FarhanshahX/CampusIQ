import Student from "../models/Student.js";

export const createStudent = async (req, res) => {
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

export const getStudents = async (req, res) => {
  const students = await Student.find();
  res.json(students);
};
