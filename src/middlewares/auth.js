import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookie?.accessToken ||
            req.header("Authorization")?.replace("Bearer", "");
        if (!token) {
            console.log("Unauthorized Token..");
            throw new ApiError(401, "Unauthorized requet");
        }
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            console.log("Invalid access token.");
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user = user;
    } catch (error) {
        console.log("Error while verify JWT token");
        throw new ApiError(401, error?.message || "Invalid Access token error catch");
    }
});
