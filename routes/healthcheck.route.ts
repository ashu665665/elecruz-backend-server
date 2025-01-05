import express from "express";
import { healthcheck } from "../controllers/healthcheck.controller"; 

const healthcheckRouter = express.Router();

healthcheckRouter.get("/", healthcheck);

export default healthcheckRouter;
