import mongoose from "mongoose";

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return { persistent: true }; // already connected (warm serverless invocation)
  const uri = process.env.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log("MongoDB connected:", uri.replace(/\/\/.*@/, "//***@"));
    return { persistent: true };
  }
  // Dev fallback: in-memory MongoDB (data resets when the server stops)
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri("skincarehub"));
  console.log("MongoDB (in-memory, dev) connected — set MONGODB_URI in .env for persistent data");
  return { persistent: false };
}
