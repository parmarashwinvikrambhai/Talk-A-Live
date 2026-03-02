import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const mongoURI = process.env.MONGO_URI || process.env.LOCAL_MONGO_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined");
    }

    await mongoose.connect(mongoURI);

    if (isProduction) {
      console.log("🚀 Database connected in PRODUCTION mode...");
    } else {
      console.log("💻 Database connected in LOCAL DEVELOPMENT mode...");
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
export default dbConnect;
