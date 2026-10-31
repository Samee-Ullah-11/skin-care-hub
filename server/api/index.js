import app from "../src/app.js";
import { connectDb } from "../src/db.js";
import { seed } from "../src/seed.js";

// Vercel serverless entry point: connect to MongoDB once per warm instance,
// then hand every request to the Express app.
let ready;

export default async function handler(req, res) {
  try {
    ready ||= connectDb().then(seed);
    await ready;
  } catch (e) {
    ready = undefined; // retry on the next request
    console.error("DB connection failed:", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database connection failed — please try again." }));
    return;
  }
  return app(req, res);
}
