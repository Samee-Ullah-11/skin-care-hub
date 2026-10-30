import jwt from "jsonwebtoken";
import { User } from "./models.js";

export function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function publicUser(u) {
  return {
    id: u._id,
    role: u.role,
    name: u.name,
    email: u.email || "",
    phone: u.phone || "",
    credits: u.credits || 0,
    clinicId: u.clinicId || null
  };
}

export async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) throw new Error("gone");
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: "Please sign in." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== "admin")) {
      return res.status(403).json({ error: "You do not have access to this." });
    }
    next();
  };
}
