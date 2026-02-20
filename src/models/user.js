import db from "../db.js";
import bcrypt from "bcryptjs";

export const findByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
