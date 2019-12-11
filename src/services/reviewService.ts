import { Document, DocumentQuery } from "mongoose";
import Curation from "../models/Curation";
import Review from "../models/Review";
import updateQueryResults from "../helpers/query/updateQueryResults";

interface IQuery {
  author: string;
  book: string;
  curation: string;
  list_type: string;
  user: string;
}

interface ISearchQuery {
  query: string;
  size: number;
  page: number;
}

interface IReview extends Document {
  author: string;
  books: string[];
  contents: string;
  likes: string[];
  published: boolean;
  thumbnail: string;
  title: string;
}

const reviewService = {
  getReviews: async (query: IQuery) => {
    let reviews: Document[];
    const { author, book, curation, list_type, user } = query;

    function findMatchingReviews(
      condition: object
    ): DocumentQuery<Document[], Document, {}> {
      return Review.find(condition)
        .populate({ path: "author", select: "image name profile" })
        .select("-book");
    }

    if (list_type) {
      if (list_type === "recommended") {
        // Get 20 reviews with most likes (that are published)
        const allReviews = await findMatchingReviews({ published: true });
        allReviews.sort((a: any, b: any) => b.likes.length - a.likes.length);
        reviews = updateQueryResults(reviews, allReviews.slice(0, 20));
      } else if (list_type === "my_likes") {
        reviews = updateQueryResults(
          reviews,
          await findMatchingReviews({ likes: user })
        );
      }
    }
    if (author) {
      // Get all reviews by a specific user / author
      reviews = updateQueryResults(
        reviews,
        await findMatchingReviews({ author })
      );
    }
    if (book) {
      // Get all reviews about a specific book (published)
      reviews = updateQueryResults(
        reviews,
        await findMatchingReviews({ books: book, published: true })
      );
    }
    if (curation) {
      // Get reviews that are contained in a specific curation
      const curationDoc: any = await Curation.findById(curation).populate({
        path: "reviews",
        select: "-books",
        populate: {
          path: "author",
          select: "image name profile"
        }
      });
      reviews = updateQueryResults(reviews, curationDoc.reviews);
    }
    return reviews;
  },

  searchReviews: async ({ query, size, page }: ISearchQuery) => {
    size = size ? size : 20;
    page = page ? page : 1;
    return Review.search({ query, page, size });
  },

  getReview: async (id: string) => {
    return await Review.findById(id)
      .populate({
        path: "author",
        select: "image name profile"
      })
      .select("-books");
  },

  postReview: async (postBody: IReview) => {
    const review: Document = new Review(postBody);
    await review.save();
    return await Review.findById(review.id)
      .populate({
        path: "author",
        select: "image name profile"
      })
      .select("-books");
  },

  patchReview: async (patchBody: IReview, id: string) => {
    const review = await Review.findById(id);
    if (!review) {
      return Promise.reject({
        status: 404,
        type: "ReviewNotFound",
        message: "해당 서평에 대한 정보를 찾지 못했습니다."
      });
    }
    if ((review as IReview).author.toString() !== patchBody.author) {
      return Promise.reject({
        status: 401,
        type: "Unauthorized",
        message: "해당 서평에 수정 권한이 없습니다."
      });
    }
    for (const key of Object.keys(patchBody)) {
      review[key] = (patchBody as any)[key];
    }
    await review.save();
    return await Review.findById(id)
      .populate({
        path: "author",
        select: "image name profile"
      })
      .select("-books");
  },

  deleteReview: async (id: string, user: string) => {
    const review: IReview = (await Review.findById(id)) as IReview;
    if (!review) {
      return Promise.reject({
        status: 404,
        type: "ReviewNotFound",
        message: "해당 서평에 대한 정보를 찾을 수가 없습니다."
      });
    } else if (review.author.toString() !== user) {
      return Promise.reject({
        status: 401,
        type: "Unauthorized",
        message: "해당 리뷰를 삭제할 수 있는 권한이 없습니다."
      });
    }
    await Review.findByIdAndDelete(id);
  },

  postLike: async (review: string, user: string) => {
    const reviewDoc = await Review.findById(review);
    if (!reviewDoc) {
      return Promise.reject({
        status: 404,
        type: "ReviewNotFound",
        message: "해당 서평에 대한 정보를 찾지 못했습니다."
      });
    }
    if ((reviewDoc as IReview).likes.includes(user)) {
      return Promise.reject({
        status: 409,
        type: "DuplicateLike",
        message: "이미 좋아요를 한 서평입니다."
      });
    }
    (reviewDoc as IReview).likes.push(user);
    await reviewDoc.save();
  },

  deleteLike: async (review: string, user: string) => {
    const reviewDoc: IReview = (await Review.findById(review)) as IReview;
    if (!reviewDoc) {
      return Promise.reject({
        status: 404,
        type: "ReviewNotFound",
        message: "해당 서평에 대한 정보를 찾지 못했습니다."
      });
    }
    const index = reviewDoc.likes.indexOf(user);
    if (index === -1) {
      return Promise.reject({
        status: 404,
        type: "LikeNotFound",
        message: "해당 좋아요에 대한 정보를 찾지 못했습니다."
      });
    }
    reviewDoc.likes.splice(index, 1);
    await reviewDoc.save();
  }
};

export default reviewService;
