"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorizedUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthorizedUser = (req, res, next) => {
    var _a, _b, _c;
    try {
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) ||
            ((_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", "")) ||
            ((_c = req.header("authorization")) === null || _c === void 0 ? void 0 : _c.replace("Bearer ", ""));
        if (!token) {
            return res.status(401).json({ message: "token not provided" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "secret is missing provided" });
        }
        const decode = jsonwebtoken_1.default.verify(token, secret);
        req.user = decode;
        next();
    }
    catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.isAuthorizedUser = isAuthorizedUser;
//# sourceMappingURL=auth.middleware.js.map