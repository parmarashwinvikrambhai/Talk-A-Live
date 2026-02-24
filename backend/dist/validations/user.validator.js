"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidator = exports.userValidator = void 0;
const zod_1 = require("zod");
exports.userValidator = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "Name must be at least 2-3 character")
        .max(40, "Name must be at most 40 character"),
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    profilePic: zod_1.z.union([zod_1.z.string().url(), zod_1.z.literal("")]).optional(),
});
exports.loginValidator = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
//# sourceMappingURL=user.validator.js.map