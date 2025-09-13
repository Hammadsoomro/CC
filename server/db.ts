import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const dbName =
    process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim();
  if (dbName) await mongoose.connect(uri, { dbName });
  else await mongoose.connect(uri);
  isConnected = true;
}
