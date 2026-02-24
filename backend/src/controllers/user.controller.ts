import { Request, Response } from "express";
import userRepositories from "../repositories/user.repositories";
import { ZodError } from "zod";
import { loginValidator, userValidator } from "../validations/user.validator";
import User from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req: Request, res: Response) => {
  try {
    const validateData = userValidator.safeParse(req.body);
    if (!validateData.success) {
      return res
        .status(400)
        .json({ message: validateData.error.issues[0].message });
    }
    const { name, email, password, profilePic } = validateData.data;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User is alredy registered with email" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await userRepositories.createUser({
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
  } catch (error) {
    return res.status(error instanceof ZodError ? 400 : 500).json({
      message:
        error instanceof ZodError
          ? error.issues[0].message
          : "Internal Server Error",
    });
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const validateData = loginValidator.safeParse(req.body);
    if (!validateData.success) {
      return res
        .status(400)
        .json({ message: validateData.error.issues[0].message });
    }
    const { email, password } = validateData.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid credential..." });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(404).json({ message: "Invalid credential..." });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(404).json({ message: "missing secret" });
    }
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      secret,
      { expiresIn: "1d" },
    );
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
  } catch (error) {
    return res.status(error instanceof ZodError ? 400 : 500).json({
      message:
        error instanceof ZodError
          ? error.issues[0].message
          : "Internal Server Error",
    });
  }
}

export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ message: "Loggedout successfully" });
  } catch (error) {
    return res.status(error instanceof ZodError ? 400 : 500).json({
      message:
        error instanceof ZodError
          ? error.issues[0].message
          : "Internal server error...",
    });
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await userRepositories.getUserProfile(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(error instanceof ZodError ? 400 : 500).json({
      message:
        error instanceof ZodError
          ? error.issues[0].message
          : "Internal server error...",
    });
  }
}

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.search ? (req.query.search as string) : "";
    const users = await userRepositories.searchUsers(keyword, req.user?.id);
    res.send(users);
  } catch (error) {
    return res.status(error instanceof ZodError ? 400 : 500).json({
      message:
        error instanceof ZodError
          ? error.issues[0].message
          : "Internal server error...",
    });
  }
}

export const updateProfilePic = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { profilePic } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!profilePic)
      return res.status(400).json({ message: "Profile picture is required" });

    const updatedUser = await userRepositories.updateProfilePic(
      userId,
      profilePic,
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    return res
      .status(200)
      .json({ message: "Profile picture updated", user: updatedUser });
  } catch (error) {
    console.error("Update profile pic error:", error);
    return res.status(error instanceof ZodError ? 400 : 500).json({
      message:
        error instanceof ZodError
          ? error.issues[0].message
          : "Internal server error...",
    });
  }
}
