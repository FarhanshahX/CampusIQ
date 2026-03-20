// import Student from "../models/Student.js";
// import cloudinary from "../config/cloudinary.js";

// export const createStudent = async (req, res) => {
//   const {
//     registrationNumber,
//     firstName,
//     lastName,
//     gender,
//     dateOfBirth,
//     email,
//     mobile,
//     college,
//     department,
//     section,
//     rollNumber,
//     studentPhoto,
//     password,
//     confirmPassword,
//   } = req.body;

//   const existing = await Student.findOne({ registrationNumber });
//   if (existing) {
//     return res.status(400).json({ message: "Student already exists" });
//   }

// const uploadToCloudinary = (file, folder) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader
//       .upload_stream({ folder, resource_type: "image" }, (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       })
//       .end(file.buffer);
//   });
// };

// let studentPhotoUrl = "";
// let idCardPhotoUrl = "";

// if (req.files?.studentPhoto) {
//   const result = await uploadToCloudinary(
//     req.files.studentPhoto[0],
//     "students/photos",
//   );
//   studentPhotoUrl = result.secure_url;
// }

//   if (req.files?.idCardPhoto) {
//     const result = await uploadToCloudinary(
//       req.files.idCardPhoto[0],
//       "students/id-cards",
//     );
//     idCardPhotoUrl = result.secure_url;
//   }

//   if (!password || !confirmPassword) {
//     return res
//       .status(400)
//       .json({ message: "Password and confirmPassword are required" });
//   }

//   if (password !== confirmPassword) {
//     return res.status(400).json({ message: "Passwords do not match" });
//   }

//   const student = await Student.create({
//     registrationNumber,
//     firstName,
//     lastName,
//     gender,
//     dateOfBirth,
//     email,
//     mobile,
//     college,
//     department,
//     section,
//     rollNumber,
//     studentPhoto,
//     studentPhoto: studentPhotoUrl,
//     password,
//   });

//   res.status(201).json({
//     message: "Student created successfully",
//     student,
//   });
// };

// export const getStudents = async (req, res) => {
//   const students = await Student.find().select("-password");
//   res.json(students);
// };

const Student = require("../models/Student.js");
const PreApprovedStudent = require("../models/PreApprovedStudent.js");
const Department = require("../models/Department.js");
const cloudinary = require("../config/cloudinary.js");
const sgMail = require("../config/sendgrid.js");
const bcrypt = require("bcryptjs");

// ==============================
// STEP 1: Send OTP
// ==============================

const initiateRegistration = async (req, res) => {
  try {
    const { registrationNumber, officialEmail, departmentId } = req.body;

    const approvedStudent = await PreApprovedStudent.findOne({
      registrationNumber,
      officialEmail,
      department: departmentId,
    });

    if (!approvedStudent) {
      return res.status(400).json({
        message: "You are not registered in this department.",
      });
    }

    if (approvedStudent.isRegistered) {
      return res.status(400).json({
        message: "Student already registered.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(otp);

    approvedStudent.otp = otp;
    approvedStudent.otpExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await approvedStudent.save();

    // Send OTP via SendGrid
    await sgMail.send({
      to: officialEmail,
      from: process.env.FROM_EMAIL,
      subject: "Your OTP for Student Registration",
      html: `<h3>Your OTP is: ${otp}</h3><p>Valid for 30 minutes.</p>`,
    });

    res.json({ message: "OTP sent to official email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP sending failed" });
  }
};

// ==============================
// STEP 2: Verify OTP & Create Student
// ==============================

const completeRegistration = async (req, res) => {
  try {
    const {
      registrationNumber,
      officialEmail,
      mobile,
      otp,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      college,
      departmentId,
      section,
      rollNumber,
      password,
      confirmPassword,
    } = req.body;

    const approvedStudent = await PreApprovedStudent.findOne({
      registrationNumber,
      officialEmail,
    });

    if (!approvedStudent) {
      return res.status(400).json({ message: "Invalid registration." });
    }

    if (
      approvedStudent.otp !== otp ||
      approvedStudent.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existing = await Student.findOne({ registrationNumber });
    if (existing) {
      return res.status(400).json({ message: "Student already exists." });
    }

    const uploadToCloudinary = (file, folder) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(file.buffer);
      });
    };

    let studentPhotoUrl = "";

    if (req.files?.studentPhoto) {
      const result = await uploadToCloudinary(
        req.files.studentPhoto[0],
        "students/photos",
      );
      studentPhotoUrl = result.secure_url;
    }

    const student = await Student.create({
      registrationNumber,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email: officialEmail,
      mobile,
      college,
      department: departmentId,
      section,
      rollNumber,
      studentPhoto: studentPhotoUrl,
      password,
    });

    // Mark as registered
    approvedStudent.isRegistered = true;
    approvedStudent.otp = null;
    approvedStudent.otpExpires = null;
    await approvedStudent.save();

    res.status(201).json({
      message: "Student registered successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

// fetch list of departments for dropdowns
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().select(
      "departmentName semester",
    );
    res.json(departments);
  } catch (err) {
    console.error("getDepartments error:", err);
    res.status(500).json({ message: "Error fetching departments" });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.body.userId);

    if (student) {
      student.firstName = req.body.firstName || student.firstName;
      student.lastName = req.body.lastName || student.lastName;
      student.mobile = req.body.mobile || student.mobile;

      // Update CGPA if provided
      if (req.body.cgpa) {
        student.cgpa = req.body.cgpa;
      }

      if (req.body.photoUrl) {
        if (req.body.photoUrl.startsWith("data:image")) {
          const result = await cloudinary.uploader.upload(req.body.photoUrl, {
            folder: "students/photos",
          });
          student.studentPhoto = result.secure_url;
        } else {
          student.studentPhoto = req.body.photoUrl;
        }
      }

      if (req.body.password) {
        student.password = req.body.password; // pre-save hook handles hashing
      }

      const updatedStudent = await student.save();

      res.json({
        _id: updatedStudent._id,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        email: updatedStudent.email,
        mobile: updatedStudent.mobile,
        registrationNumber: updatedStudent.registrationNumber,
        departmentID: updatedStudent.department,
        cgpa: updatedStudent.cgpa,
        studentPhoto: updatedStudent.studentPhoto,
        role: "STUDENT",
      });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiateRegistration,
  completeRegistration,
  getDepartments,
  updateStudentProfile,
};
