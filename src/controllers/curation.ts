import express, { Request, Response } from "express";
import curationService from "../services/curationService";
import InvalidBody from "../helpers/errors/invalidBody";
import InvalidQuery from "../helpers/errors/invalidQuery";
import InternalError from "../helpers/errors/internalError";
import Unauthorized from "../helpers/errors/unauthorized";

const curationRouter: express.Router = express.Router();

curationRouter.get("/", async (req: Request, res: Response) => {
  const { author, list_type, book, review } = req.query;
  if (!author && !list_type && !book && !review) {
    return res.status(400).send(InvalidQuery);
  }
  if (list_type === "my_likes") {
    if (!req.session.user) {
      return res
        .status(401)
        .send(
          Unauthorized(
            "인증을 한 후에 내가 좋아한 큐레이션을 불러올 수 있습니다."
          )
        );
    }
  }
  req.query.user = req.session.user;
  try {
    const getCurationsRes = await curationService.getCurations(req.query);
    res.status(200).send(getCurationsRes);
  } catch (error) {
    res.status(500).send(InternalError);
  }
});

curationRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const getCurationRes = await curationService.getCuration(req.params.id);
    res.status(200).send(getCurationRes);
  } catch (error) {
    if (error.type === "CurationNotFound") {
      res.status(404).send({ error });
    } else {
      res.status(500).send(InternalError);
    }
  }
});

curationRouter.post("/", async (req: Request, res: Response) => {
  const { books, contents, reviews, title } = req.body;
  if (!books || !contents || !reviews || !title) {
    return res.status(400).send(InvalidBody);
  } else if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("인증을 한 후에 큐레이션을 생성할 수 있습니다."));
  }
  req.body.author = req.session.user;
  try {
    const postCurationRes = await curationService.postCuration(req.body);
    res.status(201).send(postCurationRes);
  } catch (error) {
    res.status(500).send(InternalError);
  }
});

curationRouter.patch("/:id", async (req: Request, res: Response) => {
  const { contents, title } = req.body;
  if (!contents || !title) {
    return res.status(400).send(InvalidBody);
  } else if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("해당 큐레이션에 수정 권한이 없습니다."));
  }
  req.body.author = req.session.user;
  try {
    const patchCurationRes = await curationService.patchCuration(
      req.body,
      req.params.id
    );
    res.status(200).send(patchCurationRes);
  } catch (error) {
    if (error.type === "CurationNotFound") {
      return res.status(404).send({ error });
    } else if (error.type === "Unauthorized") {
      return res.status(401).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

curationRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await curationService.deleteCuration(req.params.id, req.session.user);
    res.sendStatus(204);
  } catch (error) {
    if (error.type === "CurationNotFound") {
      return res.status(404).send({ error });
    } else if (error.type === "Unauthorized") {
      return res.status(401).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

curationRouter.post("/:id/likes", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("로그인 한 후 좋아요를 누를 수 있습니다."));
  }
  try {
    await curationService.postLike(req.params.id, req.session.user);
    res.status(201).send({ user: req.session.user, curation: req.params.id });
  } catch (error) {
    if (error.type === "CurationNotFound") {
      return res.status(404).send({ error });
    } else if (error.type === "DuplicateLike") {
      return res.status(409).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

curationRouter.delete("/:id/likes", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res
      .status(401)
      .send(Unauthorized("해당 좋아요를 취소할 수 없습니다."));
  }
  try {
    await curationService.deleteLike(req.params.id, req.session.user);
    res.sendStatus(204);
  } catch (error) {
    if (error.type === "CurationNotFound") {
      return res.status(404).send({ error });
    } else if (error.type === "LikeNotFound") {
      return res.status(404).send({ error });
    }
    res.status(500).send(InternalError);
  }
});

export default curationRouter;
