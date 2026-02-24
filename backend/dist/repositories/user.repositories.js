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
const user_model_1 = __importDefault(require("../models/user.model"));
const createUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const user = new user_model_1.default(data);
    return yield user.save();
});
const getUserProfile = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return user_model_1.default.findById(id).select("-password");
});
const searchUsers = (query, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const keyword = query
        ? {
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ],
        }
        : {};
    const users = yield user_model_1.default.find(keyword).find({ _id: { $ne: currentUserId } });
    return users;
});
const updateProfilePic = (id, profilePic) => __awaiter(void 0, void 0, void 0, function* () {
    return user_model_1.default.findByIdAndUpdate(id, { profilePic }, { new: true }).select("-password");
});
exports.default = {
    createUser,
    getUserProfile,
    searchUsers,
    updateProfilePic,
};
//# sourceMappingURL=user.repositories.js.map