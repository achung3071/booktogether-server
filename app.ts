import connectMongo from "connect-mongo";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import io from "socket.io";
import mongoose from "mongoose";
import morgan from "morgan";
import passport from "passport";
import passportInitialize from "./src/config/passport";
import scheduleMigrations from "./src/config/scheduler";
import { Server } from "http";
import session from "express-session";
import SNSMessageToJSON from "./src/helpers/middleware/snsMiddleware";
import AppRouter from "./src/controllers";
const app: express.Application = express();
const MongoStore = connectMongo(session);
dotenv.config();

(async () => {
  const dbUrl: string =
    process.env.NODE_ENV === "test"
      ? process.env.TEST_DB_URL
      : process.env.DB_URL;
  await mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db = mongoose.connection;
  scheduleMigrations();
  const whitelist = [process.env.CLIENT_URL, process.env.LOCAL_CLIENT_URL];
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    })
  );
  app.use(SNSMessageToJSON);
  app.use(express.json());
  app.use(
    session({
      secret: process.env.SECRET, // Secret that protects the session
      resave: false, // Do not resave sessions, unless they are changed
      saveUninitialized: false, // no uninitialized sessions (if no change from default)
      store: new MongoStore({ mongooseConnection: db })
    })
  );
  app.use(passport.initialize()); // passport를 app의 미들웨어로 설정
  // app.use(passport.session()); // 요청 시 deserialization에 사용 ({session: false}일 때 불필요)
  passportInitialize();
  app.use(AppRouter);

  let server: Server;
  if (process.env.NODE_ENV !== "test") {
    server = app.listen(process.env.PORT, (): void => {
      console.log("Listening on port 5000");
    });
    app.set("socket", io(server));
  }
})();

export default app; // for testing
