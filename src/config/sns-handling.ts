import AWS from "aws-sdk";
import dotenv from "dotenv";
import { Request, Response } from "express";
import User from "../models/User";
dotenv.config();

const sns = new AWS.SNS({
  accessKeyId: process.env.DEFAULT_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.DEFAULT_AWS_SECRET_ACCESS_KEY,
  region: process.env.DEFAULT_AWS_REGION
});

const bouncesTopicParams = {
  Protocol: "https",
  TopicArn: process.env.BOUNCES_TOPIC_ARN,
  Endpoint: `${process.env.SERVER_URL}/auth/findpw-bounces`
};

const complaintsTopicParams = {
  Protocol: "https",
  TopicArn: process.env.COMPLAINTS_TOPIC_ARN,
  Endpoint: `${process.env.SERVER_URL}/auth/findpw-complaints`
};

sns.subscribe(bouncesTopicParams, (error, data) => {
  if (error) {
    console.log(`SNS subscription failed: ${JSON.stringify(error)}`);
  }
  console.log(`SNS subscription configured: ${JSON.stringify(data)}`);
});

sns.subscribe(complaintsTopicParams, (error, data) => {
  if (error) {
    console.log(`SNS subscription failed: ${JSON.stringify(error)}`);
  }
  console.log(`SNS subscription configured: ${JSON.stringify(data)}`);
});

const handleSnsNotification = async (req: Request, res: Response) => {
  const message = JSON.parse(req.body.Message);
  if (
    message &&
    (message.notificationType === "Bounce" ||
      message.notificationType === "Complaint")
  ) {
    const mail = message.mail;
    if (mail && mail.destination) {
      try {
        for (const email of mail.destination) {
          const user: any = await User.findOne({ email });
          if (user) {
            user.emailError = true;
            await user.save();
          }
        }
      } catch (error) {
        console.log(error.message);
      }
    }
  }
};

const handleSNSResponse = async (
  topicArn: string,
  req: Request,
  res: Response
) => {
  const messageType = req.headers["x-amz-sns-message-type"];
  if (messageType === "Notification" && req.body.Message) {
    await handleSnsNotification(req, res);
  } else if (messageType === "SubscriptionConfirmation") {
    const params = {
      Token: req.body.Token,
      TopicArn: topicArn
    };
    sns.confirmSubscription(params, (error, data) => {
      if (error) {
        console.log(`Subscription confirm error: ${JSON.stringify(error)}`);
      }
      console.log(`Subscription confirmed: ${JSON.stringify(data)}`);
    });
  }
};

export default handleSNSResponse;
