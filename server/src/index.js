import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./db.js";
import { seed } from "./seed.js";

const port = process.env.PORT || 5000;
connectDb()
  .then(seed)
  .then(() => app.listen(port, () => console.log("API running on http://127.0.0.1:" + port)))
  .catch((e) => {
    console.error("Failed to start:", e);
    process.exit(1);
  });
