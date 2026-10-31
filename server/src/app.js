import express from "express";
import cors from "cors";
import routes from "./routes.js";

// The Express app, with no server attached — used by src/index.js for local
// development (app.listen) and by api/index.js on Vercel (serverless handler).
const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" })); // clinic photos are uploaded as compressed data URLs

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong — please try again." });
});

export default app;
