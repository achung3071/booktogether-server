import { Document } from "mongoose";
import client from "../../config/elasticsearch";

interface IBook extends Document {
  authors: string[];
  contents: string;
  thumbnail: string;
  title: string;
}

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

export function esIndexBook(book: Document): Promise<any> {
  const { authors, contents, thumbnail, title } = book as IBook;
  return client
    .index({
      index: "books",
      id: book.id,
      refresh: "true",
      body: { authors, contents, thumbnail, title }
    })
    .catch(error => console.log(error));
}

export async function esIndexReview(review: Document): Promise<any> {
  try {
    const populatedReview: IReview = (
      await review
        .populate({
          path: "author",
          select: "image name profile"
        })
        .populate({ path: "books", select: "authors title" })
        .execPopulate()
    ).toObject();
    delete populatedReview._id;
    await client.index({
      index: "reviews",
      id: review.id,
      refresh: "true",
      body: populatedReview
    });
  } catch (error) {
    console.log(error);
  }
}
