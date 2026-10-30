import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import { seed } from "./seed.js";
import routes from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" })); // clinic photos are uploaded as compressed data URLs

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong — please try again." });
});

const port = process.env.PORT || 5000;
connectDb()
  .then(seed)
  .then(() => app.listen(port, () => console.log("API running on http://127.0.0.1:" + port)))
  .catch((e) => {
    console.error("Failed to start:", e);
    process.exit(1);
  });
