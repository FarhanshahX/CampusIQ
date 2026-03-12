const Department = require("../models/Department.js");
const Admin = require("../models/Admin.js");
const Teacher = require("../models/Teacher.js");

// const nodemailer = require("nodemailer");

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // 1. Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res
        .status(400)
        .json({ message: "Admin already exists with this email" });
    }

    // 2. Create new admin instance
    // The password will be automatically hashed by the .pre('save') hook in your schema
    const admin = new Admin({
      name,
      email,
      password,
      department: department || null,
    });

    // 3. Save to database
    await admin.save();

    // 4. Respond (excluding password for security)
    res.status(201).json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        department: admin.department,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentYear, semester, academicBatch, adminId } =
      req.body;

    const shortCode = generateShortCode();

    const department = await Department.create({
      departmentName,
      departmentYear,
      semester,
      academicBatch,
      shortCode,
      admin: adminId,
    });

    await Admin.findByIdAndUpdate(adminId, {
      department: department._id,
    });

    res.json({
      message: "Department Created Successfully",
      shortCode,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating department" });
  }
};

const createTeacher = async (req, res) => {
  const { firstName, lastName, employeeId, email, designation, department } =
    req.body;

  const existing = await Teacher.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Teacher already exists" });
  }

  const rawPassword = employeeId;

  const teacher = await Teacher.create({
    firstName,
    lastName,
    employeeId,
    email,
    designation,
    department,
    password: rawPassword,
  });

  res.status(201).json({
    message: "Teacher created successfully",
    teacher,
    tempPassword: rawPassword,
  });
};

const getTeachers = async (req, res) => {
  const teachers = await Teacher.find().select("-password");
  res.json(teachers);
};

const getDeptTeachers = async (req, res) => {
  const deptID = req.params.deptID;
  const teachers = await Teacher.find({ department: deptID }).select(
    "-password",
  );
  res.json(teachers);
};

const getDepartment = async (req, res) => {
  const { adminID } = req.params;
  const department = await Department.findOne({ admin: adminID });
  res.json(department);
};

// const getDepartmentsbyTeacher = async (req, res) => {
//   const teacherID = req.params.teacherID;
//   const departments = await Department.find({ assignedTeachers: teacherID });
//   res.json(departments);
// };

module.exports = {
  createDepartment,
  createAdmin,
  createTeacher,
  getTeachers,
  getDepartment,
  getDeptTeachers,
};
