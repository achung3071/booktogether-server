import express, { Request, Response } from "express";
import ratingService from "../services/ratingService";
import InvalidBody from "../helpers/errors/invalidBody";
import InvalidQuery from "../helpers/errors/invalidQuery";
import InternalError from "../helpers/errors/internalError";
import Unauthorized from "../helpers/errors/unauthorized";

const ratingRouter: express.Router = express.Router();

ratingRouter.get("/", async (req: Request, res: Response) => {
  const { books, user } = req.query;
  if (!books) {
    return res.status(400).send(InvalidQuery);
  }
  if (!user && req.session.user) {
    req.query.user = req.session.user;
  }
  try {
    const getRatingsRes = await ratingService.getRatings(req.query);
    res.status(200).send(getRatingsRes);
  } catch (error) {
    res.status(500).send(InternalError);
  }
});

ratingRouter.post("/", async (req: Request, res: Response) => {
  const { book, rating } = req.body;
  if (!book || !rating) {
    return res.status(400).send(InvalidBody);
  }
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("로그인 한 후 평점을 매길 수 있습니다."));
  }
  const postBody = { book, user: req.session.user, rating };
  try {
    const postRatingRes = await ratingService.postRating(postBody);
    return res.status(201).send(postRatingRes);
  } catch (error) {
    if (error.type === "DuplicateRating") {
      return res.status(409).send({ error });
    }
    return res.status(500).send(InternalError);
  }
});

ratingRouter.patch("/:id", async (req: Request, res: Response) => {
  const { rating } = req.body;
  if (rating === undefined) {
    return res.status(400).send(InvalidBody);
  }
  const patchBody = { id: req.params.id, rating, user: req.session.user };
  try {
    const patchRatingRes = await ratingService.patchRating(patchBody);
    return res.status(200).send(patchRatingRes);
  } catch (error) {
    if (error.type === "Unauthorized") {
      return res.status(401).send({ error });
    } else if (error.type === "RatingNotFound") {
      return res.status(404).send({ error });
    }
    return res.status(500).send(InternalError);
  }
});

export default ratingRouter;
