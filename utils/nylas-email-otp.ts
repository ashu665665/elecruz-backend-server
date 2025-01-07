require("dotenv").config();
import axios from "axios";

const nylas_grant_id = process.env.USER_GRANT_ID!;
const nylas_bearer_token = process.env.NYLAS_API_KEY!

export const sendOTPtoMail = async (name: any, otp: any, email: any) => {
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


    await axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            throw error;
        });

}