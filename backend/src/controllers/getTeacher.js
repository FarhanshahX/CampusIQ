import Teacher from "../models/Teacher.js";

export const getTeachers = async (req, res) => {
  const teachers = await Teacher.find().select("-password");
  res.json(teachers);
};
