require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import twilio from "twilio";
import prisma from "../utils/prisma";
import jwt from "jsonwebtoken";
import { sendToken } from "../utils/send-token";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
import { sendOTPtoMail } from "../utils/nylas-email-otp";
import { ObjectId } from 'mongodb';

// register new user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone_number } = req.body;
    console.log(phone_number);
    try {
      await client.verify.v2
        .services(process.env.TWILIO_SERVICE_SID!)
        .verifications.create({
          channel: "sms",
          to: phone_number,
        });

      res.status(201).json({
        success: true,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
};

// verify otp
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Reached")
    const { phone_number, otp } = req.body;

    try {
      await client.verify.v2
        .services(process.env.TWILIO_SERVICE_SID!)
        .verificationChecks.create({
          to: phone_number,
          code: otp,
        });

      console.log("verified")
      // is user exist
      const isUserExist = await prisma.user.findUnique({
        where: {
          phone_number,
        },
      });
      if (isUserExist) {
        await sendToken(isUserExist, res);
      } else {
        // create account
        const user = await prisma.user.create({
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
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        message: "Something went wrong!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
};

// sending otp to email
export const sendingOtpToEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, userId } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const user = {
      userId,
      name,
      email,
    };
    const token = jwt.sign(
      {
        user,
        otp,
      },
      process.env.EMAIL_ACTIVATION_SECRET!,
      {
        expiresIn: "5m",
      }
    );
    try {
      sendOTPtoMail(name, otp, email);
      res.status(201).json({
        success: true,
        token,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}
// verifying email otp
export const verifyingEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { otp, token } = req.body;

    const newUser: any = jwt.verify(
      token,
      process.env.EMAIL_ACTIVATION_SECRET!
    );

    if (newUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is not correct or expired!",
      });
    }

    const { name, email, userId } = newUser.user;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (user?.email === null) {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: name,
          email: email,
        },
      });
      await sendToken(updatedUser, res);
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Your otp is expired!",
    });
  }
};

// get logged in user data
export const getLoggedInUserData = async (req: any, res: Response) => {
  try {
    const user = req.user;

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

// getting user rides
export const getAllRides = async (req: any, res: Response) => {
  const rides = await prisma.rides.findMany({
    where: {
      userId: req.user?.id,
    },
    include: {
      driver: true,
      user: true,
    },
  });
  res.status(201).json({
    rides,
  });
};

export const storeToken = async (req: any, res: Response) => {
  try {
    console.log(`Storing Token`);
    const deviceId = req.user?.id;
    const pushToken = req.data.pushToken;

    if (!deviceId || !pushToken) {
      return res.status(400).json({ success: false, message: "Missing deviceId or pushToken" });
    }

    const existingToken = await prisma.token.findFirst({
      where: {
        deviceId: deviceId, // Assuming `deviceId` is stored as a string
      },
    });

    let token;
    if (existingToken) {
      token = await prisma.token.update({
        where: { id: existingToken.id }, // Use the unique `id`
        data: {
          token: pushToken,
          updatedAt: new Date(), // Automatically updated by @updatedAt, but explicit for clarity
        },
      });
    } else {
      token = await prisma.token.create({
        data: {
          id: new ObjectId().toString(), // Ensuring it's a valid ObjectId string
          deviceId: deviceId,
          token: pushToken,
        },
      });
    }

    console.log("Stored Token:", token);
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error storing token:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getToken = async (req: any, res: Response) => {
  try {
    console.log("Fetching token for deviceId:", req.data.driverId);

    const token = await prisma.token.findFirst({
      where: {
        deviceId: req.data.driverId, // ✅ Ensuring deviceId is passed correctly
      },
    });

    if (!token) {
      console.warn(`No token found for deviceId: ${req.data.driverId}`);
      return res.status(404).json({ success: false, message: "Token not found" });
    }

    console.log("Retrieved Token:", token);
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error retrieving token:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export const testApi = async (req: any, res: Response) => {
  res.status(200).json({ success: true });
}
