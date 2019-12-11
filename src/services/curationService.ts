import { Document, DocumentQuery } from "mongoose";
import Curation from "../models/Curation";
import updateQueryResults from "../helpers/query/updateQueryResults";

interface IQuery {
  author: string;
  book: string;
  list_type: string;
  review: string;
  user: string;
}

interface ICuration extends Document {
  author: string;
  books: string[];
  contents: string;
  likes: string[];
  reviews: string[];
  title: string;
}

const curationService = {
  getCurations: async (query: IQuery) => {
    let curations: Document[];
    const { author, book, list_type, review, user } = query;

    function findMatchingCurations(
      condition: object
    ): DocumentQuery<Document[], Document, {}> {
      return Curation.find(condition)
        .populate({ path: "author", select: "image name profile" })
        .select("-books -reviews");
    }

    if (list_type) {
      if (list_type === "recommended") {
        // Get 20 curations with most likes
        const allCurations = await findMatchingCurations({});
        allCurations.sort((a: any, b: any) => b.likes.length - a.likes.length);
        curations = updateQueryResults(curations, allCurations.slice(0, 20));
      } else if (list_type === "my_likes") {
        curations = updateQueryResults(
          curations,
          await findMatchingCurations({ likes: user })
        );
      }
    }
    if (author) {
      // Get all curations by a certain user
      curations = updateQueryResults(
        curations,
        await findMatchingCurations({ author })
      );
    }
    if (book) {
      // Get curations that contain a specific book
      curations = updateQueryResults(
        curations,
        await findMatchingCurations({ books: book })
      );
    }
    if (review) {
      // Get curations that contain a specific review
      curations = updateQueryResults(
        curations,
        await findMatchingCurations({ reviews: review })
      );
    }
    return curations;
  },

  getCuration: async (id: string) => {
    const curation: Document = await Curation.findById(id)
      .populate({ path: "author", select: "image name profile" })
      .select("-books -reviews");
    if (curation) {
      return curation;
    } else {
      return Promise.reject({
        status: 404,
        type: "CurationNotFound",
        message: "해당 큐레이션에 대한 정보를 찾을 수가 없습니다."
      });
    }
  },

  postCuration: async (postBody: ICuration) => {
    const curation: Document = new Curation(postBody);
    await curation.save();
    return await Curation.findById(curation.id)
      .populate({
        path: "author",
        select: "image name profile"
      })
      .select("-books -reviews");
  },

  patchCuration: async (patchBody: ICuration, id: string) => {
    const curation: Document = await Curation.findById(id);
    if (!curation) {
      return Promise.reject({
        status: 404,
        type: "CurationNotFound",
        message: "해당 큐레이션에 대한 정보를 찾지 못했습니다."
      });
    }
    if ((curation as ICuration).author.toString() !== patchBody.author) {
      return Promise.reject({
        status: 401,
        type: "Unauthorized",
        message: "해당 큐레이션에 수정 권한이 없습니다."
      });
    }
    await curation.updateOne(patchBody);
    return await Curation.findById(id)
      .populate({
        path: "author",
        select: "image name profile"
      })
      .select("-books -reviews");
  },

  deleteCuration: async (id: string, user: string) => {
    const curation: Document = await Curation.findById(id);
    if (!curation) {
      return Promise.reject({
        status: 404,
        type: "CurationNotFound",
        message: "해당 큐레이션에 대한 정보를 찾지 못했습니다."
      });
    } else if ((curation as ICuration).author.toString() !== user) {
      return Promise.reject({
        status: 401,
        type: "Unauthorized",
        message: "해당 큐레이션을 삭제할 수 있는 권한이 없습니다."
      });
    }
    return Curation.findByIdAndDelete(id);
  },

  postLike: async (id: string, user: string) => {
    const curation: Document = await Curation.findById(id);
    if (!curation) {
      return Promise.reject({
        status: 404,
        type: "CurationNotFound",
        message: "해당 큐레이션에 대한 정보를 찾지 못했습니다."
      });
    }
    if ((curation as ICuration).likes.includes(user)) {
      return Promise.reject({
        status: 409,
        type: "DuplicateLike",
        message: "이미 좋아요를 한 큐레이션입니다."
      });
    }
    (curation as ICuration).likes.push(user);
    await curation.save();
  },

  deleteLike: async (id: string, user: string) => {
    const curation: ICuration = (await Curation.findById(id)) as ICuration;
    if (!curation) {
      return Promise.reject({
        status: 404,
        type: "CurationNotFound",
        message: "해당 큐레이션에 대한 정보를 찾지 못했습니다."
      });
    }
    const index = curation.likes.indexOf(user);
    if (index === -1) {
      return Promise.reject({
        status: 404,
        type: "LikeNotFound",
        message: "해당 좋아요에 대한 정보를 찾지 못했습니다."
      });
    }
    curation.likes.splice(index, 1);
    await curation.save();
  }
};

export default curationService;
