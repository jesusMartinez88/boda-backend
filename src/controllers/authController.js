import jwt from "jsonwebtoken";
import * as User from "../models/user.js";
import { initUserDefaults } from "../db.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Best-effort: registrar el último login. Si falla, no bloqueamos el login.
    try {
      await User.updateLastLogin(user.id);
    } catch (err) {
      console.warn("Could not update lastLoginAt:", err.message);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, slug: user.slug },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        slug: user.slug,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  try {
    // Verificar si el username ya existe
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Generar slug único basado en username
    const baseSlug = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Asegurar unicidad del slug
    let slug = baseSlug;
    let suffix = 1;
    while (await User.findBySlug(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const newUser = await User.createUser({ username, email, password, slug });

    // Inicializar settings y categorías por defecto
    await initUserDefaults(newUser.id);

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role, slug: newUser.slug },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        slug: newUser.slug,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

/**
 * Comprueba si un nombre de usuario está disponible para registro.
 * Reglas:
 *   - Mínimo 3 caracteres, máximo 32.
 *   - Solo letras, números, guion, guion bajo y punto.
 *   - No puede ser "admin" (reservado).
 * Devuelve `{ available: boolean, reason?: string }`.
 * No expone información sensible: solo indica disponibilidad.
 */
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
const RESERVED_USERNAMES = new Set(["admin"]);

export const checkUsername = async (req, res) => {
  const raw = typeof req.query.username === "string" ? req.query.username.trim() : "";

  if (!raw) {
    return res.status(400).json({
      success: false,
      available: false,
      reason: "missing",
      message: "Username is required",
    });
  }

  if (!USERNAME_RE.test(raw)) {
    return res.status(200).json({
      success: true,
      available: false,
      reason: "invalid_format",
    });
  }

  if (RESERVED_USERNAMES.has(raw.toLowerCase())) {
    return res.status(200).json({
      success: true,
      available: false,
      reason: "reserved",
    });
  }

  try {
    const existing = await User.findByUsername(raw);
    return res.status(200).json({
      success: true,
      available: !existing,
      reason: existing ? "taken" : "free",
    });
  } catch (error) {
    console.error("checkUsername error:", error);
    return res.status(500).json({
      success: false,
      available: false,
      reason: "server_error",
      message: "Internal server error",
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "currentPassword and newPassword are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters",
    });
  }

  try {
    const user = await User.findByUsername(req.user.username);
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    await User.updatePassword(req.user.id, newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
