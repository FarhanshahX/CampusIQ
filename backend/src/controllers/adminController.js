// const User = require("../models/User");
// const generateToken = require("../utils/generateToken");

import Teacher from "../models/Teacher.js";
import bcrypt from "bcryptjs";

export const createTeacher = async (req, res) => {
  const { name, email, department, designation, dateOfBirth, employeeId } =
    req.body;

  const existing = await Teacher.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Teacher already exists" });
  }

  const firstName = name.trim().split(" ")[0];
  const birthYear = new Date(dateOfBirth).getFullYear();
  const rawPassword = `${firstName}${birthYear}`;

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const teacher = await Teacher.create({
    name,
    email,
    department,
    designation,
    dateOfBirth,
    employeeId,
    password: hashedPassword,
  });

  res.status(201).json({
    message: "Teacher created successfully",
    teacher,
    tempPassword: rawPassword,
  });
};

export const getTeachers = async (req, res) => {
  const teachers = await Teacher.find().select("-password");
  res.json(teachers);
};
