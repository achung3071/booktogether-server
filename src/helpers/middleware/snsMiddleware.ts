import { Request, Response, NextFunction } from "express";

const SNSMessageToJSON = (req: Request, res: Response, next: NextFunction) => {
  if (req.get("x-amz-sns-message-type")) {
    req.headers["content-type"] = "application/json"; // content needs to be processed by express.json()
  }
  next();
};

export default SNSMessageToJSON;
