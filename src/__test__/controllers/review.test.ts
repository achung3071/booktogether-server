import app from "../../../app";
import bcrypt from "bcrypt";
import Book from "../../models/Book";
import Curation from "../../models/Curation";
import Review from "../../models/Review";
import User from "../../models/User";
import request from "supertest";
import { Document, Types } from "mongoose";

describe("Reviews", () => {
  // Set up all tests
  const bookId: Types.ObjectId = new Types.ObjectId();
  const curationId: Types.ObjectId = new Types.ObjectId();
  const reviewId: Types.ObjectId = new Types.ObjectId();
  const userId: Types.ObjectId = new Types.ObjectId();
  beforeAll(async done => {
    await Promise.all([
      Book.deleteMany({}),
      Curation.deleteMany({}),
      Review.deleteMany({}),
      User.deleteMany({})
    ]);
    const book: Document = new Book({
      _id: bookId,
      title: "fake book"
    });
    const curation: Document = new Curation({
      _id: curationId,
      books: [bookId],
      reviews: [reviewId],
      title: "fake curation"
    });
    const review: Document = new Review({
      _id: reviewId,
      author: userId,
      books: [bookId],
      published: true,
      title: "fake review"
    });
    const user: Document = new User({
      _id: userId,
      name: "jest",
      email: "jest@gmail.com",
      password: await bcrypt.hash("jest1234", 10)
    });
    await Promise.all([
      book.save(),
      curation.save(),
      review.save(),
      user.save()
    ]);
    done();
  });

  describe("GET /reviews", () => {
    it("should get a list of reviews by book id", done => {
      request(app)
        .get(`/reviews?book_id=${bookId}`)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body[0]).toHaveProperty("_id", reviewId.toHexString());
          expect(res.body[0]).toHaveProperty("title", "fake review");
          done();
        });
    });

    it("should get a list of reviews by curation id", done => {
      request(app)
        .get(`/reviews?curation_id=${curationId}`)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body[0]).toHaveProperty("_id", reviewId.toHexString());
          expect(res.body[0]).toHaveProperty("title", "fake review");
          done();
        });
    });

    it("should work on a combination of queries", async done => {
      await request(app)
        .get(`/reviews?book_id=${bookId}&curation_id=${curationId}`)
        .then((res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body[0]).toHaveProperty("_id", reviewId.toHexString());
          expect(res.body[0]).toHaveProperty("title", "fake review");
        });

      const randomId = new Types.ObjectId();
      request(app)
        .get(`/reviews?curation_id=${curationId}&book_id=${randomId}`)
        .then((res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body.length).toEqual(0);
          done();
        });
    });
  });

  describe("GET /reviews/:id", () => {
    it("should get the information for a specific review", done => {
      request(app)
        .get(`/reviews/${reviewId}`)
        .then((res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toHaveProperty("_id", reviewId.toHexString());
          expect(res.body).toHaveProperty("title", "fake review");
          expect(res.body).toHaveProperty("published", true);
          expect(res.body.author).toHaveProperty("_id");
          expect(res.body.author).toHaveProperty("name");
          expect(res.body.author).toHaveProperty("profile");
          expect(res.body.author).toHaveProperty("image");
          done();
        });
    });

    it("should return 404 for an invalid id", done => {
      request(app)
        .get("/reviews/jest1")
        .then((res: any) => {
          expect(res.statusCode).toBe(404);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toHaveProperty("type", "ReviewNotFound");
          done();
        });
    });
  });
});
