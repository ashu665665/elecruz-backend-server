import { Request, Response } from "express";

export const healthcheck = async (req:Request, res: Response) => {
    try {
      console.log(req);
      res.status(200).json({
        success: true,
        message: {Status : 'UP'},
      });
    } catch (error) {
      console.log(error);
    }
  };