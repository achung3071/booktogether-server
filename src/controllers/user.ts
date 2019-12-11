import express, { Request, Response, NextFunction } from "express";
import upload from "../config/s3-upload";
import userService from "../services/userService";
import Unauthorized from "../helpers/errors/unauthorized";
import InternalError from "../helpers/errors/internalError";

const userRouter: express.Router = express.Router();

userRouter.get("/", async (req: Request, res: Response) => {
  const resetPasswordToken: string = req.query.resetPasswordToken;
  const user: string = req.session.user;
  if (!resetPasswordToken && !user) {
    const message: string =
      "인증을 한 후에만 사용자 정보를 불러올 수 있습니다.";
    return res.status(401).send(Unauthorized(message));
  }
  try {
    const getUserRes = await userService.getUser({ resetPasswordToken, user });
    res.status(200).send(getUserRes);
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

userRouter.patch(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.query.resetPasswordToken && !req.session.user) {
      const message: string =
        "인증을 한 후에만 사용자 정보를 업데이트할 수 있습니다.";
      return res.status(401).send(Unauthorized(message));
    }
    next();
  },
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (req.file) {
      req.body.image = req.file.location;
    }
    const patchBody: object = req.body;
    try {
      const patchUserRes = await userService.patchUser({
        patchBody,
        resetPasswordToken: req.query.resetPasswordToken,
        user: req.session.user
      });
      res.status(200).send(patchUserRes);
    } catch (error) {
      if (error.status === 403 || error.status === 404) {
        return res.status(error.status).send({ error });
      }
      res.status(500).send(InternalError);
    }
  }
);

export default userRouter;
