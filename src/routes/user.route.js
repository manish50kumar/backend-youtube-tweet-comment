import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { vefifyJWT } from "../middlewares/auth.js";

const router = Router();

export default router;