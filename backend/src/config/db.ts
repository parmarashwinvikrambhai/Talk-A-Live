import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    let mongoURI = isProduction
      ? process.env.MONGO_URI
      : process.env.LOCAL_MONGO_URI || process.env.MONGO_URI;

    if (!mongoURI) throw new Error("MongoDB URI is not defined");

    try {
      console.log(
        "DEBUG: Attempting to connect to:",
        mongoURI.split("@").pop(),
      );
      await mongoose.connect(mongoURI);
    } catch (localError) {
      if (
        !isProduction &&
        process.env.MONGO_URI &&
        mongoURI !== process.env.MONGO_URI
      ) {
        console.log(
          "Local MongoDB not found. Falling back to Cloud Atlas...",
        );
        mongoURI = process.env.MONGO_URI;
        await mongoose.connect(mongoURI);
      } else {
        throw localError;
      }
    }

    if (mongoURI.includes("mongodb+srv")) {
      console.log("🚀 Database connected in CLOUD mode (Atlas)...");
    } else {
      console.log("💻 Database connected in LOCAL mode...");
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};
export default dbConnect;
