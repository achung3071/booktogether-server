import { Document } from "mongoose";
import Review from "../../models/Review";
import client from "../elasticsearch";

interface IReview extends Document {
  _id: string;
  author: string;
  books: string[];
  contents: string;
  likes: string[];
  published: boolean;
  thumbnail: string;
  title: string;
}

export default async () => {
  console.log("MIGRATING REVIEWS TO ELASTICSEARCH:::");
  try {
    const reviews = await Review.find({});
    for (let i = 0; i < reviews.length; i += 3500) {
      // 3500 docs: ~4.5MB batch
      const batch: Document[] = reviews.slice(i, i + 3500);
      let body: object[] = [];
      for (const review of batch) {
        const populatedReview: IReview = (
          await review
            .populate({
              path: "author",
              select: "image name profile"
            })
            .populate({ path: "books", select: "title" })
            .execPopulate()
        ).toObject();
        delete populatedReview._id;
        const indexOp = [
          { index: { _index: "reviews", _id: review.id } },
          populatedReview
        ];
        body = body.concat(indexOp);
      }
      const { body: bulkResponse } = await client.bulk({
        refresh: "true",
        body
      });
      if (bulkResponse.errors) {
        const erroredDocuments: object[] = [];
        bulkResponse.items.forEach((action: any, j: number) => {
          if (action.index.error) {
            erroredDocuments.push({
              // If the status is 429 it means that you can retry the document.
              status: action.index.status,
              error: action.index.error,
              operation: body[j * 2],
              document: body[j * 2 + 1]
            });
          }
        });
        console.log(erroredDocuments);
      }
    }
    const { body: count } = await client.count({ index: "reviews" });
    console.log("# of indexed reviews", count);
  } catch (error) {
    console.log(error);
  }
};
