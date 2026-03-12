const Admin = require("../models/Admin");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const generateToken = require("../utils/generateToken");

const login = async (req, res) => {
  const { email, role, password } = req.body;

  if (role === "ADMIN") {
    try {
      const admin = await Admin.findOne({ email });
      if (!admin || !(await admin.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!admin.department) {
        return res.json({
          _id: admin._id,
          name: admin.name,
          role: admin.role,
          token: generateToken(admin._id, admin.role),
          firstTime: true,
        });
      }
      return res.json({
        _id: admin._id,
        name: admin.name,
        role: admin.role,
        token: generateToken(admin._id, admin.role),
        firstTime: false,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else if (role === "TEACHER") {
    try {
      const teacher = await Teacher.findOne({ email });
      if (!teacher || !(await teacher.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        _id: teacher._id,
        name: teacher.name,
        role: teacher.role,
        token: generateToken(teacher._id, teacher.role),
        firstTime: false,
        departmentID: teacher.department,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

const StudentLogin = async (req, res) => {
  const { registrationNumber, password } = req.body;

  try {
    // Find student by registration number
    const student = await Student.findOne({ registrationNumber });

    if (!student) {
      return res.status(401).json({ message: "Invalid Registration Number" });
    }

    const isMatch = await student.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({
      user: {
        _id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        departmentID: student.department,
        role: "STUDENT",
      },
      token: generateToken(student._id, "STUDENT"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  StudentLogin,
};
