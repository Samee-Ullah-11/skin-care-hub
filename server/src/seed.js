import bcrypt from "bcryptjs";
import { User } from "./models.js";

// No demo data. The only thing created automatically is the Hub admin
// account, taken from .env (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME),
// so the first clinic application can be approved on a fresh database.
export async function seed() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — no admin account was created.");
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log("Promoted " + email + " to admin.");
    }
    return;
  }
  await User.create({
    role: "admin",
    name: process.env.ADMIN_NAME || "Hub Admin",
    email,
    passHash: bcrypt.hashSync(password, 10),
    credits: 0
  });
  console.log("Admin account created for " + email);
}
