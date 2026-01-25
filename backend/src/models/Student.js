import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    dateOfBirth: { type: Date, required: true },
    status: { type: String, default: "ACTIVE" },
  },
  { timestamps: true },
);

export default mongoose.model("Student", studentSchema);
