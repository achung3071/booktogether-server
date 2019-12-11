import AWS from "aws-sdk";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  SES: new AWS.SES({
    accessKeyId: process.env.DEFAULT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.DEFAULT_AWS_SECRET_ACCESS_KEY,
    region: process.env.DEFAULT_AWS_REGION
  })
});

export default transporter;
