const XLSX = require("xlsx");
const PreApprovedStudent = require("../models/PreApprovedStudent");

const uploadStudents = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // multer.memoryStorage() places the file in req.file.buffer
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (let student of data) {
      await PreApprovedStudent.create({
        registrationNumber: student["Registration Number"],
        officialEmail: student["Official Email"],
        fullName: student["Full Name"],
        department: departmentId,
      });
    }

    res.json({ message: "Students uploaded successfully" });
  } catch (error) {
    console.error("uploadStudents error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

module.exports = { uploadStudents };
