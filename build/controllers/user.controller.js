"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRides = exports.getLoggedInUserData = exports.verifyingEmail = exports.sendingOtpToEmail = exports.verifyOtp = exports.registerUser = void 0;
require("dotenv").config();
const twilio_1 = __importDefault(require("twilio"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const send_token_1 = require("../utils/send-token");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken);
const nylas_email_otp_1 = require("../utils/nylas-email-otp");
// register new user
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone_number } = req.body;
        console.log(phone_number);
        try {
            yield client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verifications.create({
                channel: "sms",
                to: phone_number,
            });
            res.status(201).json({
                success: true,
            });
        }
        catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
        });
    }
});
exports.registerUser = registerUser;
// verify otp
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Reached");
        const { phone_number, otp } = req.body;
        try {
            yield client.verify.v2
                .services(process.env.TWILIO_SERVICE_SID)
                .verificationChecks.create({
                to: phone_number,
                code: otp,
            });
            console.log("verified");
            // is user exist
            const isUserExist = yield prisma_1.default.user.findUnique({
                where: {
                    phone_number,
                },
            });
            if (isUserExist) {
                yield (0, send_token_1.sendToken)(isUserExist, res);
            }
            else {
                // create account
                const user = yield prisma_1.default.user.create({
                    data: {
                        phone_number: phone_number,
                    },
                });
                res.status(200).json({
                    success: true,
                    message: "OTP verified successfully!",
                    user: user,
                });
            }
        }
        catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: "Something went wrong!",
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
        });
    }
});
exports.verifyOtp = verifyOtp;
// sending otp to email
const sendingOtpToEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, userId } = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const user = {
            userId,
            name,
            email,
        };
        const token = jsonwebtoken_1.default.sign({
            user,
            otp,
        }, process.env.EMAIL_ACTIVATION_SECRET, {
            expiresIn: "5m",
        });
        try {
            (0, nylas_email_otp_1.sendOTPtoMail)(name, otp, email);
            res.status(201).json({
                success: true,
                token,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            console.log(error);
        }
    }
    catch (error) {
        console.log(error);
    }
});
exports.sendingOtpToEmail = sendingOtpToEmail;
// verifying email otp
const verifyingEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp, token } = req.body;
        const newUser = jsonwebtoken_1.default.verify(token, process.env.EMAIL_ACTIVATION_SECRET);
        if (newUser.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is not correct or expired!",
            });
        }
        const { name, email, userId } = newUser.user;
        const user = yield prisma_1.default.user.findUnique({
            where: {
                id: userId,
            },
        });
        if ((user === null || user === void 0 ? void 0 : user.email) === null) {
            const updatedUser = yield prisma_1.default.user.update({
                where: {
                    id: userId,
                },
                data: {
                    name: name,
                    email: email,
                },
            });
            yield (0, send_token_1.sendToken)(updatedUser, res);
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Your otp is expired!",
        });
    }
});
exports.verifyingEmail = verifyingEmail;
// get logged in user data
const getLoggedInUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.getLoggedInUserData = getLoggedInUserData;
// getting user rides
const getAllRides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const rides = yield prisma_1.default.rides.findMany({
        where: {
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        },
        include: {
            driver: true,
            user: true,
        },
    });
    res.status(201).json({
        rides,
    });
});
exports.getAllRides = getAllRides;
