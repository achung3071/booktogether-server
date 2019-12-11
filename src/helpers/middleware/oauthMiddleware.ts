import { Request, Response, NextFunction } from "express";
import InvalidQuery from "../errors/invalidQuery";

export const addSocketIdToSession = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (!req.query.socketId) {
    return res.status(400).send(InvalidQuery);
  } else {
    req.session.socketId = req.query.socketId;
    next();
  }
};

export const oAuthResponse = (provider: string) => (
  req: Request,
  res: Response
) => {
  const user: any = req.user;
  const socket = req.app.get("socket");
  if (user.error) {
    console.log("Socket", req.session.socketId, "Internal Error");
    socket.to(req.session.socketId).emit(provider, {
      error: {
        type: "InternalError",
        message: "요청을 처리하는 중 서버에 에러가 발생했습니다."
      }
    });
    res.sendStatus(500);
  } else {
    req.session.user = user.id;
    req.session.save(() => {
      console.log("Socket", req.session.socketId, "Successful Login");
      socket.to(req.session.socketId).emit(provider, {
        message: "성공적으로 소셜 로그인이 되었습니다."
      }); // without res.send(), need to manually save session.
    });
    res.sendStatus(200);
  }
};
