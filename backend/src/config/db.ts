import mongoose from "mongoose";

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Database connected Successfully...");
    } catch (error) {
       console.error("MongoDB connection failed");
       process.exit(1); 
    }
}
export default dbConnect;