import { Document } from "mongoose";
import Rating from "../models/Rating";

interface IQuery {
  books: string[];
  user: string;
}

interface IRating extends Document {
  book: string;
  user: string;
  rating: number;
}

const ratingService = {
  getRatings: async (query: IQuery) => {
    const returnArr = [];
    const { books, user } = query;
    for (const book of books) {
      const filter = { book, user };
      const userRating = user
        ? await Rating.findOne(filter).select("rating")
        : null;
      const ratings = await Rating.find({ book });
      if (ratings.length === 0) {
        continue; // Do not add specified book to array
      }
      const avgRating =
        ratings.reduce((sum: number, document: IRating) => {
          return document.rating + sum;
        }, 0) / ratings.length;
      returnArr.push({
        book,
        avg_rating: avgRating,
        user_rating: userRating
      });
    }
    return returnArr;
  },

  postRating: async ({
    book,
    user,
    rating
  }: {
    book: string;
    user: string;
    rating: number;
  }) => {
    const existing = await Rating.findOne({ book, user });
    if (existing) {
      return Promise.reject({
        status: 409,
        type: "DuplicateRating",
        message: "이미 평점을 매긴 책입니다."
      });
    }
    let newRating = new Rating({ book, user, rating });
    newRating = await newRating.save();
    return newRating;
  },

  patchRating: async ({
    id,
    user,
    rating
  }: {
    id: string;
    user: string;
    rating: number;
  }) => {
    const ratingDoc: IRating = (await Rating.findById(id)) as IRating;
    if (!ratingDoc) {
      return Promise.reject({
        status: 404,
        type: "RatingNotFound",
        message: "해당 평점에 대한 정보를 찾을 수가 없습니다."
      });
    } else if (ratingDoc.user.toString() !== user) {
      return Promise.reject({
        status: 401,
        type: "Unauthorized",
        message: "해당 평점을 수정할 수 있는 권한이 없습니다."
      });
    }
    ratingDoc.rating = rating;
    ratingDoc.save();
    return ratingDoc;
  }
};

export default ratingService;
