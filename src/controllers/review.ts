import express, { Request, Response } from "express";
import reviewService from "../services/reviewService";
import InvalidBody from "../helpers/errors/invalidBody";
import InvalidQuery from "../helpers/errors/invalidQuery";
import InternalError from "../helpers/errors/internalError";
import NotFound from "../helpers/errors/notFound";
import Unauthorized from "../helpers/errors/unauthorized";

const reviewRouter: express.Router = express.Router();

reviewRouter.get("/", async (req: Request, res: Response) => {
  const { author, list_type, book, curation } = req.query;
  if (!author && !list_type && !book && !curation) {
    return res.status(400).send(InvalidQuery);
  }
  if (list_type === "my_likes") {
    if (!req.session.user) {
      return res
        .status(401)
        .send(
          Unauthorized("인증을 한 후에 내가 좋아한 서평을 가져올 수 있습니다.")
        );
    }
    req.query.user = req.session.user; // add user so it can be used to filter
  }
  try {
    const getReviewsRes = await reviewService.getReviews(req.query);
    res.status(200).send(getReviewsRes);
  } catch (error) {
    res.status(500).send(InternalError);
  }
});

reviewRouter.get("/search", async (req: Request, res: Response) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).send(InvalidQuery);
  }
  try {
    const results: object = await reviewService.searchReviews(req.query);
    res.status(200).send(results);
  } catch (error) {
    res.status(500).send(InternalError);
  }
});

reviewRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const getReviewRes: any = await reviewService.getReview(req.params.id);
    if (
      !getReviewRes.published &&
      req.session.user !== getReviewRes.author.id
    ) {
      return res
        .status(401)
        .send(Unauthorized("해당 서평에 접근 권한이 없습니다."));
    }
    if (!getReviewRes) {
      res
        .status(404)
        .send(
          NotFound(
            "ReviewNotFound",
            "해당 서평에 대한 정보를 찾을 수가 없습니다."
          )
        );
    } else {
      res.status(200).send(getReviewRes);
    }
  } catch (error) {
    if (error.name === "CastError") {
      res
        .status(404)
        .send(
          NotFound(
            "ReviewNotFound",
            "해당 서평에 대한 정보를 찾을 수가 없습니다."
          )
        );
    } else {
      res.status(500).send(InternalError);
    }
  }
});

reviewRouter.post("/", async (req: Request, res: Response) => {
  const { books, contents, published, title } = req.body;
  if (!books || !contents || typeof published !== "boolean" || !title) {
    return res.status(400).send(InvalidBody);
  }
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("서평을 생성할 수 있는 권한이 없습니다."));
  }
  req.body.author = req.session.user;
  try {
    const postReviewRes = await reviewService.postReview(req.body);
    res.status(201).send(postReviewRes);
  } catch (error) {
    res.status(500).send(InternalError);
  }
});

reviewRouter.patch("/:id", async (req: Request, res: Response) => {
  const { contents, published, title } = req.body;
  if (!contents || typeof published !== "boolean" || !title) {
    return res.status(400).send(InvalidBody);
  }
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("해당 서평에 수정 권한이 없습니다."));
  }
  req.body.author = req.session.user;
  try {
    const patchReviewRes = await reviewService.patchReview(
      req.body,
      req.params.id
    );
    res.status(200).send(patchReviewRes);
  } catch (error) {
    if (error.type === "ReviewNotFound") {
      return res.status(404).send({ error });
    }
    if (error.type === "Unauthorized") {
      return res.status(401).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

reviewRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await reviewService.deleteReview(req.params.id, req.session.user);
    res.sendStatus(204);
  } catch (error) {
    if (error.type === "ReviewNotFound") {
      return res.status(404).send({ error });
    }
    if (error.type === "Unauthorized") {
      return res.status(401).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

reviewRouter.post("/:id/likes", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("로그인 한 후 좋아요를 누를 수 있습니다."));
  }
  try {
    await reviewService.postLike(req.params.id, req.session.user);
    res.status(201).send({ user: req.session.user, review: req.params.id });
  } catch (error) {
    if (error.name === "CastError" || error.type === "ReviewNotFound") {
      return res
        .status(404)
        .send(
          NotFound("ReviewNotFound", "해당 서평에 대한 정보를 찾지 못했습니다.")
        );
    } else if (error.type === "DuplicateLike") {
      return res.status(409).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

reviewRouter.delete("/:id/likes", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("해당 좋아요를 취소할 수 없습니다."));
  }
  try {
    await reviewService.deleteLike(req.params.id, req.session.user);
    res.sendStatus(204);
  } catch (error) {
    if (error.name === "CastError" || error.type === "ReviewNotFound") {
      return res
        .status(404)
        .send(
          NotFound("ReviewNotFound", "해당 서평에 대한 정보를 찾지 못했습니다.")
        );
    } else if (error.type === "LikeNotFound") {
      return res.status(404).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

export default reviewRouter;
