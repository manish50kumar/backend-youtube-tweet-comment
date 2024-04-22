import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import bodyParser from "body-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser());
app.use(bodyParser.json()); // Parse JSON bodies

// import all the route here
import userRouter from "./routes/user.route.js";

// defination of all import route 
app.use("/api/v1/users", userRouter);

export { app };
