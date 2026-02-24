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
exports.updateProfilePic = exports.searchUsers = exports.getProfile = exports.logoutUser = exports.loginUser = exports.createUser = void 0;
const user_repositories_1 = __importDefault(require("../repositories/user.repositories"));
const zod_1 = require("zod");
const user_validator_1 = require("../validations/user.validator");
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateData = user_validator_1.userValidator.safeParse(req.body);
        if (!validateData.success) {
            return res
                .status(400)
                .json({ message: validateData.error.issues[0].message });
        }
        const { name, email, password, profilePic } = validateData.data;
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            return res
                .status(409)
                .json({ message: "User is alredy registered with email" });
        }
        const hashPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield user_repositories_1.default.createUser({
            name,
            email,
            password: hashPassword,
            profilePic,
        });
        res.status(201).json({
            message: "User Registered successfully...",
            user: {
                id: user._id,
                name: user.name,
            },
        });
    }
    catch (error) {
        return res.status(error instanceof zod_1.ZodError ? 400 : 500).json({
            message: error instanceof zod_1.ZodError
                ? error.issues[0].message
                : "Internal Server Error",
        });
    }
});
exports.createUser = createUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateData = user_validator_1.loginValidator.safeParse(req.body);
        if (!validateData.success) {
            return res
                .status(400)
                .json({ message: validateData.error.issues[0].message });
        }
        const { email, password } = validateData.data;
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Invalid credential..." });
        }
        const isPasswordMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(404).json({ message: "Invalid credential..." });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(404).json({ message: "missing secret" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, name: user.name, email: user.email }, secret, { expiresIn: "1d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            message: "Login successfull",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        return res.status(error instanceof zod_1.ZodError ? 400 : 500).json({
            message: error instanceof zod_1.ZodError
                ? error.issues[0].message
                : "Internal Server Error",
        });
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        res.status(200).json({ message: "Loggedout successfully" });
    }
    catch (error) {
        return res.status(error instanceof zod_1.ZodError ? 400 : 500).json({
            message: error instanceof zod_1.ZodError
                ? error.issues[0].message
                : "Internal server error...",
        });
    }
});
exports.logoutUser = logoutUser;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = yield user_repositories_1.default.getUserProfile(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        return res.status(error instanceof zod_1.ZodError ? 400 : 500).json({
            message: error instanceof zod_1.ZodError
                ? error.issues[0].message
                : "Internal server error...",
        });
    }
});
exports.getProfile = getProfile;
const searchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const keyword = req.query.search ? req.query.search : "";
        const users = yield user_repositories_1.default.searchUsers(keyword, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.send(users);
    }
    catch (error) {
        return res.status(error instanceof zod_1.ZodError ? 400 : 500).json({
            message: error instanceof zod_1.ZodError
                ? error.issues[0].message
                : "Internal server error...",
        });
    }
});
exports.searchUsers = searchUsers;
const updateProfilePic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { profilePic } = req.body;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!profilePic)
            return res.status(400).json({ message: "Profile picture is required" });
        const updatedUser = yield user_repositories_1.default.updateProfilePic(userId, profilePic);
        if (!updatedUser)
            return res.status(404).json({ message: "User not found" });
        return res
            .status(200)
            .json({ message: "Profile picture updated", user: updatedUser });
    }
    catch (error) {
        console.error("Update profile pic error:", error);
        return res.status(error instanceof zod_1.ZodError ? 400 : 500).json({
            message: error instanceof zod_1.ZodError
                ? error.issues[0].message
                : "Internal server error...",
        });
    }
});
exports.updateProfilePic = updateProfilePic;
//# sourceMappingURL=user.controller.js.map