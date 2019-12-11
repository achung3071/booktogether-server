import express from "express";
import authRouter from "./auth";
import bookRouter from "./book";
import curationRouter from "./curation";
import ratingRouter from "./rating";
import reviewRouter from "./review";
import userRouter from "./user";
const AppRouter: express.Router = express.Router();

AppRouter.use("/auth", authRouter);
AppRouter.use("/books", bookRouter);
AppRouter.use("/curations", curationRouter);
AppRouter.use("/ratings", ratingRouter);
AppRouter.use("/reviews", reviewRouter);
AppRouter.use("/user", userRouter);

export default AppRouter;
