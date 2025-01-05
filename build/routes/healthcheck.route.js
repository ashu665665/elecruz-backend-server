"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const healthcheck_controller_1 = require("../controllers/healthcheck.controller");
const healthcheckRouter = express_1.default.Router();
healthcheckRouter.get("/", healthcheck_controller_1.healthcheck);
exports.default = healthcheckRouter;
