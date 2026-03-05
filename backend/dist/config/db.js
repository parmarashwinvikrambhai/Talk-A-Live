"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnect = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isProduction = process.env.NODE_ENV === "production";
        let mongoURI = isProduction
            ? process.env.MONGO_URI
            : process.env.LOCAL_MONGO_URI || process.env.MONGO_URI;
        if (!mongoURI)
            throw new Error("MongoDB URI is not defined");
        try {
            console.log("DEBUG: Attempting to connect to:", mongoURI.split("@").pop());
            yield mongoose_1.default.connect(mongoURI);
        }
        catch (localError) {
            if (!isProduction &&
                process.env.MONGO_URI &&
                mongoURI !== process.env.MONGO_URI) {
                console.log("Local MongoDB not found. Falling back to Cloud Atlas...");
                mongoURI = process.env.MONGO_URI;
                yield mongoose_1.default.connect(mongoURI);
            }
            else {
                throw localError;
            }
        }
        if (mongoURI.includes("mongodb+srv")) {
            console.log("🚀 Database connected in CLOUD mode (Atlas)...");
        }
        else {
            console.log("💻 Database connected in LOCAL mode...");
        }
    }
    catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
});
exports.default = dbConnect;
//# sourceMappingURL=db.js.map