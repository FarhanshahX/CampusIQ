const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const SubjectScore = require("../models/SubjectScore");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

// @desc    Update teacher profile
// @route   PUT /api/teacher/profile
// @access  Private (Teacher)
const updateTeacherProfile = async (req, res) => {
  try {
    console.log("Updating profile for user:", req.body.userId);
    const teacher = await Teacher.findById(req.body.userId);

    if (teacher) {
      teacher.firstName = req.body.firstName || teacher.firstName;
      teacher.lastName = req.body.lastName || teacher.lastName;
      teacher.email = req.body.email || teacher.email;
      teacher.designation = req.body.designation || teacher.designation;
      if (req.body.photoUrl) {
        if (req.body.photoUrl.startsWith("data:image")) {
          const result = await cloudinary.uploader.upload(req.body.photoUrl, {
            folder: "teachers/photos",
          });
          teacher.photoUrl = result.secure_url;
        } else {
          teacher.photoUrl = req.body.photoUrl;
        }
      }

      if (req.body.password) {
        teacher.password = req.body.password; // pre-save hook handles hashing
      }

      console.log("Saving teacher data...");
      const updatedTeacher = await teacher.save();
      console.log("Profile updated successfully");

      res.json({
        _id: updatedTeacher._id,
        firstName: updatedTeacher.firstName,
        lastName: updatedTeacher.lastName,
        email: updatedTeacher.email,
        designation: updatedTeacher.designation,
        photoUrl: updatedTeacher.photoUrl,
        role: updatedTeacher.role,
      });
    } else {
      res.status(404).json({ message: "Teacher not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get teacher analytics for a specific subject
// @route   GET /api/teacher/analytics/:teacherId/:subjectId
// @access  Private (Teacher)
const getTeacherAnalytics = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Find students in the same department and semester as the subject
    const students = await Student.find({
      department: subject.department,
      // For now, listing all students in dept. If semester filtering is needed:
      // semester: subject.semester
    }).select("-password").sort({ rollNumber: 1 });

    const studentIds = students.map((s) => s._id);

    // Fetch scores for this subject only
    const scores = await SubjectScore.find({
      student: { $in: studentIds },
      subjectID: subjectId,
    });

    // Fetch attendance for this subject
    const sessions = await AttendanceSession.find({
      subject: subjectId,
      status: "closed",
    });
    const sessionIds = sessions.map((s) => s._id);

    const attendanceRecords = await AttendanceRecord.find({
      session: { $in: sessionIds },
    });

    // Maps
    const studentAttendanceMap = {};
    attendanceRecords.forEach((r) => {
      const sid = r.student.toString();
      studentAttendanceMap[sid] = (studentAttendanceMap[sid] || 0) + 1;
    });

    const studentScoresMap = {};
    scores.forEach((sc) => {
      const sid = sc.student.toString();
      studentScoresMap[sid] = sc;
    });

    const totalSessionsForSubject = sessions.length;

    // Aggregates
    let totalMarksSum = 0;
    let marksCount = 0;
    let totalAttRateSum = 0;
    let atRiskCount = 0;

    const studentData = students.map((s) => {
      const sid = s._id.toString();
      const attended = studentAttendanceMap[sid] || 0;
      const attRate = totalSessionsForSubject > 0 
        ? Math.round((attended / totalSessionsForSubject) * 100) 
        : 0;
      
      const scoreObj = studentScoresMap[sid];
      const marks = scoreObj ? scoreObj.totalMarks || 0 : 0;
      
      // Thresholds for "At Risk" (Subject specific)
      // Marks < 40% (of 145 = 58) or Attendance < 75%
      const marksThreshold = 58; 
      const isAtRisk = attRate < 75 || (scoreObj && marks < marksThreshold);

      if (scoreObj) {
        totalMarksSum += marks;
        marksCount++;
      }
      totalAttRateSum += attRate;
      if (isAtRisk) atRiskCount++;

      return {
        _id: sid,
        name: `${s.firstName} ${s.lastName}`,
        registrationNumber: s.registrationNumber,
        rollNumber: s.rollNumber,
        section: s.section,
        latestCgpa: s.cgpa ? s.cgpa.filter(c => c > 0).pop() || 0 : 0,
        attendanceRate: attRate,
        attended,
        totalSessions: totalSessionsForSubject,
        totalMarks: marks,
        internalTotal: scoreObj ? scoreObj.internalTotal || 0 : 0,
        internalTests: scoreObj ? scoreObj.internalTests || [] : [],
        experiments: scoreObj ? scoreObj.experiments || [] : [],
        assignments: scoreObj ? scoreObj.assignments || [] : [],
        theory: scoreObj ? scoreObj.theory || 0 : 0,
        isAtRisk,
      };
    });

    const avgMarks = marksCount > 0 ? (totalMarksSum / marksCount).toFixed(2) : 0;
    const avgInternalTotal = marksCount > 0 
      ? (studentData.reduce((acc, s) => acc + s.internalTotal, 0) / marksCount).toFixed(2) 
      : 0;
    const avgAttendanceRate = students.length > 0 ? Math.round(totalAttRateSum / students.length) : 0;

    // Fetch recent sessions (last 10 closed)
    const recentSessionsRaw = await AttendanceSession.find({
      subject: subjectId,
      status: "closed",
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    const recentSessions = await Promise.all(
      recentSessionsRaw.map(async (sess) => {
        const presentCount = await AttendanceRecord.countDocuments({
          session: sess._id,
          status: "present",
        });
        return {
          _id: sess._id,
          date: sess.date.toLocaleDateString("en-GB"),
          sessionType: sess.sessionType,
          topic: sess.topic,
          present: presentCount,
          total: sess.totalStudents,
        };
      })
    );

    res.json({
      overview: {
        totalStudents: students.length,
        avgMarks: parseFloat(avgMarks),
        avgInternalTotal: parseFloat(avgInternalTotal),
        avgAttendanceRate,
        atRiskCount,
      },
      students: studentData,
      subject: {
        name: subject.subjectName,
        code: subject.subjectCode,
      },
      recentSessions,
    });

  } catch (error) {
    console.error("Teacher analytics error:", error);
    res.status(500).json({ message: error.message });
  }
};

const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// ... existing imports ...

// @desc    Download marks template for a specific subject
// @route   GET /api/teacher/template/:subjectId
const getMarksTemplate = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const students = await Student.find({ department: subject.department }).sort({ rollNumber: 1 });

    const headers = ["Reg Number", "Name"];
    if (subject.subjectType !== "Lab+Practical") {
        for(let i=1; i<=6; i++) headers.push(`Test ${i}`);
    }
    if (subject.subjectType !== "Theory") {
        for(let i=1; i<=10; i++) headers.push(`Exp ${i}`);
        for(let i=1; i<=2; i++) headers.push(`Assignment ${i}`);
    }
    if (subject.subjectType === "Theory+Lab+Practical") headers.push("Practical Oral");
    if (subject.subjectType !== "Lab+Practical") headers.push("Theory Exam");

    const data = students.map(s => {
        const row = [s.registrationNumber, `${s.firstName} ${s.lastName}`];
        // Add empty values for marks
        headers.slice(2).forEach(() => row.push(""));
        return row;
    });

    const worksheet = xlsx.utils.aoa_to_sheet([headers, ...data]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Marks Template");

    const filePath = path.join(__dirname, "../uploads", `Template_${subject.subjectCode}.xlsx`);
    xlsx.writeFile(workbook, filePath);

    res.download(filePath, `Template_${subject.subjectCode}.xlsx`, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(filePath); // Cleanup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload student marks via Excel/CSV
// @route   POST /api/teacher/upload-marks
const uploadMarks = async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const results = [];
    for (const row of data) {
      const regNo = row["Reg Number"];
      if (!regNo) continue;

      const student = await Student.findOne({ registrationNumber: regNo });
      if (!student) continue;

      const marks = {
        internalTests: [],
        experiments: [],
        assignments: [],
        practicalOral: 0,
        theory: 0,
      };

      // Extract marks based on headers
      if (subject.subjectType !== "Lab+Practical") {
        for(let i=1; i<=6; i++) marks.internalTests.push(Number(row[`Test ${i}`]) || 0);
      }
      if (subject.subjectType !== "Theory") {
        for(let i=1; i<=10; i++) marks.experiments.push(Number(row[`Exp ${i}`]) || 0);
        for(let i=1; i<=2; i++) marks.assignments.push(Number(row[`Assignment ${i}`]) || 0);
      }
      if (subject.subjectType === "Theory+Lab+Practical") marks.practicalOral = Number(row["Practical Oral"]) || 0;
      if (subject.subjectType !== "Lab+Practical") marks.theory = Number(row["Theory Exam"]) || 0;

      // Calculate totals
      const internalTotal = ((marks.internalTests.reduce((a,b)=>a+b, 0) / 60) * 20);
      const experimentTotal = (marks.experiments.reduce((a,b)=>a+b, 0) / 10);
      const assignmentTotal = (marks.assignments.reduce((a,b)=>a+b, 0) / 2);
      
      const totalMarks = internalTotal + experimentTotal + assignmentTotal + marks.practicalOral + marks.theory;

      await SubjectScore.findOneAndUpdate(
        { student: student._id, subjectID: subjectId },
        { 
          ...marks,
          internalTotal,
          experimentTotal,
          assignmentTotal,
          totalMarks,
          updatedAt: Date.now()
        },
        { upsert: true }
      );
      results.push(regNo);
    }

    fs.unlinkSync(req.file.path); // Cleanup
    res.json({ message: `Successfully updated marks for ${results.length} students.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateTeacherProfile,
  getTeacherAnalytics,
  getMarksTemplate,
  uploadMarks,
};
