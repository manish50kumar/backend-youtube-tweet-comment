import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";

import {
    registerUser,
    loginUser,
    logoutUser
} from "../controllers/user.controller.js";

const router = Router();

router.post(
    "/register",
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

// send data in row & json formet
router.post(
    '/login',
    
    loginUser
);

// logout user jwtauth then logout
router.post("/logout", verifyJWT, logoutUser);

export default router;