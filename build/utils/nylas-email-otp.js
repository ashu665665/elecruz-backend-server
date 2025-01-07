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
exports.sendOTPtoMail = void 0;
require("dotenv").config();
const axios_1 = __importDefault(require("axios"));
const nylas_grant_id = process.env.USER_GRANT_ID;
const nylas_bearer_token = process.env.NYLAS_API_KEY;
const sendOTPtoMail = (name, otp, email) => __awaiter(void 0, void 0, void 0, function* () {
    let data = JSON.stringify({
        "subject": "Verify your email address!",
        "body": `
            <p>Hi ${name},</p>
        <p>Your Elecruz verification code is ${otp}. If you didn't request for this OTP, please ignore this email!</p>
        <p>Thanks,<br>Elecruz Team</p>
            `,
        "to": [{ name: name, email: email }],
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.us.nylas.com/v3/grants/' + nylas_grant_id + '/messages/send',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + nylas_bearer_token
        },
        data: data
    };
    yield axios_1.default.request(config)
        .then((response) => {
        console.log(JSON.stringify(response.data));
    })
        .catch((error) => {
        throw error;
    });
});
exports.sendOTPtoMail = sendOTPtoMail;
