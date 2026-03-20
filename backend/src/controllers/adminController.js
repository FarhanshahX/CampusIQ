const Department = require("../models/Department.js");
const Admin = require("../models/Admin.js");
const Teacher = require("../models/Teacher.js");
const AttendanceSession = require("../models/AttendanceSession.js");
const AttendanceRecord = require("../models/AttendanceRecord.js");
const Subject = require("../models/Subject.js");
const SubjectScore = require("../models/SubjectScore.js");
const Student = require("../models/Student.js");

// const nodemailer = require("nodemailer");

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res
        .status(400)
        .json({ message: "Admin already exists with this email" });
    }

    const admin = new Admin({
      name,
      email,
      password,
      department: department || null,
    });

    await admin.save();

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

  // Add teacher to department's teachers array
  await Department.findByIdAndUpdate(department, {
    $push: { teachers: teacher._id },
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
  const department = await Department.findOne({ admin: adminID })
    .populate("subjects")
    .populate("teachers", "firstName lastName email");
  res.json(department);
};

const incrementSemester = async (req, res) => {
  try {
    const { adminID } = req.params;
    const dept = await Department.findOne({ admin: adminID });
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const currentSem = dept.semester || 1;
    if (currentSem >= 8) {
      return res.status(400).json({ message: "Already at final semester (8)" });
    }

    const newSem = currentSem + 1;
    const newYear = Math.ceil(newSem / 2);

    dept.semester = newSem;
    dept.departmentYear = newYear;
    await dept.save();

    res.json({
      message: "Semester incremented",
      semester: newSem,
      departmentYear: newYear,
      department: dept,
    });
  } catch (err) {
    res.status(500).json({ message: "Error incrementing semester" });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId)
      .select("-password")
      .populate("department", "departmentName semester");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher details" });
  }
};

const editDepartment = async (req, res) => {
  try {
    const { adminID } = req.params;
    const { departmentName, academicBatch, collegeName, degreeType } = req.body;
    const dept = await Department.findOneAndUpdate(
      { admin: adminID },
      { departmentName, academicBatch, collegeName, degreeType },
      { new: true },
    );
    if (!dept) return res.status(404).json({ message: "Department not found" });
    res.json({ message: "Department updated", department: dept });
  } catch (err) {
    res.status(500).json({ message: "Error updating department" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/attendance-overview/:adminID
// ─────────────────────────────────────────────────────────────────────────────
const getAdminAttendanceOverview = async (req, res) => {
  try {
    const { adminID } = req.params;
    const dept = await Department.findOne({ admin: adminID });
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const sessions = await AttendanceSession.find({
      department: dept._id,
      status: "closed",
    })
      .populate("subject", "subjectName subjectCode")
      .populate("teacher", "firstName lastName")
      .sort({ date: -1 });

    if (sessions.length === 0) {
      return res.json({
        summary: {
          totalSessions: 0,
          totalPresent: 0,
          totalAbsent: 0,
          overallRate: 0,
        },
        subjectBreakdown: [],
        studentBreakdown: [],
        recentSessions: [],
      });
    }

    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      session: { $in: sessionIds },
    }).populate("student", "firstName lastName rollNumber section");

    // Build presence map: sessionId → Set of present student IDs
    const presenceMap = {};
    sessions.forEach((s) => {
      presenceMap[s._id.toString()] = new Set();
    });
    records.forEach((r) => {
      presenceMap[r.session.toString()]?.add(r.student?._id?.toString());
    });

    // ── Summary ──
    let totalPresent = 0;
    let totalAbsent = 0;
    sessions.forEach((s) => {
      const present = presenceMap[s._id.toString()].size;
      totalPresent += present;
      totalAbsent += Math.max(0, (s.totalStudents || 0) - present);
    });
    const overallRate =
      totalPresent + totalAbsent > 0
        ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
        : 0;

    // ── Subject Breakdown ──
    const subjectMap = {};
    sessions.forEach((s) => {
      const key = s.subject?._id?.toString() || "unknown";
      if (!subjectMap[key]) {
        subjectMap[key] = {
          subjectName: s.subject?.subjectName || "Unknown",
          subjectCode: s.subject?.subjectCode || "",
          sessions: 0,
          present: 0,
          absent: 0,
        };
      }
      const present = presenceMap[s._id.toString()].size;
      subjectMap[key].sessions += 1;
      subjectMap[key].present += present;
      subjectMap[key].absent += Math.max(0, (s.totalStudents || 0) - present);
    });
    const subjectBreakdown = Object.values(subjectMap).map((s) => ({
      ...s,
      rate:
        s.present + s.absent > 0
          ? Math.round((s.present / (s.present + s.absent)) * 100)
          : 0,
    }));

    // ── Student Breakdown ──
    const studentMap = {};
    records.forEach((r) => {
      if (!r.student) return;
      const sid = r.student._id.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = {
          _id: sid,
          name: `${r.student.firstName} ${r.student.lastName}`,
          rollNumber: r.student.rollNumber,
          section: r.student.section,
          attended: 0,
        };
      }
      studentMap[sid].attended += 1;
    });
    const totalSessions = sessions.length;
    const studentBreakdown = Object.values(studentMap)
      .map((s) => ({
        ...s,
        totalSessions,
        rate:
          totalSessions > 0
            ? Math.round((s.attended / totalSessions) * 100)
            : 0,
      }))
      .sort((a, b) => a.rate - b.rate);

    // ── Recent Sessions (last 20) ──
    const recentSessions = sessions.slice(0, 20).map((s) => {
      const d = new Date(s.date);
      return {
        _id: s._id,
        date: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        rawDate: s.date,
        subjectName: s.subject?.subjectName || "",
        teacherName: s.teacher
          ? `${s.teacher.firstName} ${s.teacher.lastName}`
          : "",
        sessionType: s.sessionType,
        present: presenceMap[s._id.toString()].size,
        total: s.totalStudents || 0,
        topic: s.topic || "",
      };
    });

    res.json({
      summary: { totalSessions, totalPresent, totalAbsent, overallRate },
      subjectBreakdown,
      studentBreakdown,
      recentSessions,
    });
  } catch (error) {
    console.error("Admin attendance overview error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/analytics/:adminID
// ─────────────────────────────────────────────────────────────────────────────
const getAdminAnalytics = async (req, res) => {
  try {
    const { adminID } = req.params;
    const dept = await Department.findOne({ admin: adminID });
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const students = await Student.find({ department: dept._id })
      .select("-password")
      .sort({ rollNumber: 1 });

    const subjects = await Subject.find({ department: dept._id }).populate(
      "assignedTeacher",
      "firstName lastName",
    );

    const studentIds = students.map((s) => s._id);
    const subjectScores = await SubjectScore.find({
      student: { $in: studentIds },
    }).populate("subjectID", "subjectName subjectCode");

    const closedSessions = await AttendanceSession.find({
      department: dept._id,
      status: "closed",
    });
    const sessionIds = closedSessions.map((s) => s._id);
    const attendanceRecords = await AttendanceRecord.find({
      session: { $in: sessionIds },
    });

    // Per-student attendance count
    const studentAttendanceMap = {};
    attendanceRecords.forEach((r) => {
      const sid = r.student.toString();
      studentAttendanceMap[sid] = (studentAttendanceMap[sid] || 0) + 1;
    });
    const totalSessions = closedSessions.length;

    // Per-student subject scores map
    const studentScoresMap = {};
    subjectScores.forEach((sc) => {
      const sid = sc.student.toString();
      if (!studentScoresMap[sid]) studentScoresMap[sid] = [];
      studentScoresMap[sid].push({
        subjectName: sc.subjectID?.subjectName || "",
        subjectCode: sc.subjectID?.subjectCode || "",
        internalTotal: sc.internalTotal || 0,
        experimentTotal: sc.experimentTotal || 0,
        assignmentTotal: sc.assignmentTotal || 0,
        practicalOral: sc.practicalOral || 0,
        theory: sc.theory || 0,
        totalMarks: sc.totalMarks || 0,
      });
    });

    // Per-subject aggregation
    const subjectAgg = {};
    subjectScores.forEach((sc) => {
      const key = sc.subjectID?._id?.toString();
      if (!key) return;
      if (!subjectAgg[key]) {
        subjectAgg[key] = {
          subjectName: sc.subjectID.subjectName,
          subjectCode: sc.subjectID.subjectCode,
          scores: [],
        };
      }
      subjectAgg[key].scores.push(sc.totalMarks || 0);
    });
    const subjectAnalytics = Object.values(subjectAgg).map((s) => {
      const scores = s.scores;
      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      return {
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        avgScore: avg,
        highScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowScore: scores.length > 0 ? Math.min(...scores) : 0,
        students: scores.length,
      };
    });

    // Per-student data
    let totalCgpa = 0;
    let cgpaCount = 0;
    let totalAttRate = 0;
    let atRiskCount = 0;

    const studentData = students.map((s) => {
      const sid = s._id.toString();
      const attended = studentAttendanceMap[sid] || 0;
      const attRate =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      const latestCgpa = s.cgpa ? s.cgpa.filter((c) => c > 0).pop() || 0 : 0;
      const scores = studentScoresMap[sid] || [];
      const totalMarks = scores.reduce((acc, sc) => acc + sc.totalMarks, 0);

      if (latestCgpa > 0) {
        totalCgpa += latestCgpa;
        cgpaCount++;
      }
      totalAttRate += attRate;
      if (attRate < 75 || latestCgpa < 5) atRiskCount++;

      return {
        _id: sid,
        name: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber,
        section: s.section,
        registrationNumber: s.registrationNumber,
        cgpa: s.cgpa,
        latestCgpa,
        attendanceRate: attRate,
        attended,
        totalSessions,
        totalMarks,
        subjectScores: scores,
      };
    });

    const avgCgpa = cgpaCount > 0 ? (totalCgpa / cgpaCount).toFixed(2) : 0;
    const avgAttendanceRate =
      students.length > 0 ? Math.round(totalAttRate / students.length) : 0;

    res.json({
      overview: {
        totalStudents: students.length,
        avgCgpa: parseFloat(avgCgpa),
        avgAttendanceRate,
        atRiskCount,
      },
      students: studentData,
      subjects: subjectAnalytics,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getTeacherBySubjectId = async (req, res) => {
  const { subjectId } = req.params;
  const subject = await Subject.findById(subjectId).populate(
    "assignedTeacher",
    "firstName lastName email",
  );
  const teacher = subject.assignedTeacher;
  res.json(teacher);
};

module.exports = {
  createDepartment,
  createAdmin,
  createTeacher,
  getTeachers,
  getTeacherById,
  getDepartment,
  getDeptTeachers,
  incrementSemester,
  editDepartment,
  getAdminAttendanceOverview,
  getAdminAnalytics,
  getTeacherBySubjectId,
};
