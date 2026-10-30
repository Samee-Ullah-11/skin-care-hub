// One-off clean start: removes EVERYTHING from the database (demo clinics,
// demo accounts, test bookings). Run with:  node src/reset.js
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import { User, Clinic, Booking, Review, Application, Counter } from "./models.js";

await connectDb();
const results = await Promise.all([
  User.deleteMany({}), Clinic.deleteMany({}), Booking.deleteMany({}),
  Review.deleteMany({}), Application.deleteMany({}), Counter.deleteMany({})
]);
console.log("Removed:", results.map((r) => r.deletedCount).join(", "), "(users, clinics, bookings, reviews, applications, counters)");
await mongoose.disconnect();
console.log("Database is clean — start the server and the admin account is created from .env.");
process.exit(0);
