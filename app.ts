require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route";
import driverRouter from "./routes/driver.route";
import healthcheckRouter from "./routes/healthcheck.route";
const cors = require("cors");

export const app = express();
app.use(cors());

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parserv
app.use(cookieParser());

// routes
app.use("/healthcheck", healthcheckRouter)
app.use("/api/v1", userRouter);
app.use("/api/v1/driver", driverRouter);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    succcess: true,
    message: "API is working",
  });
});
