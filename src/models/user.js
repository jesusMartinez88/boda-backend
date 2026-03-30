import db from "../db.js";
import bcrypt from "bcryptjs";

export const findByUsername = async (username) => {
  return await db.get("SELECT * FROM users WHERE username = ?", [username]);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
