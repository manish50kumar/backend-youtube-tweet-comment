import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { vefifyJWT } from "../middlewares/auth.js";

import {
    registerUser,
    loginUser
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
);

export default router;