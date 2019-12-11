import { Document } from "mongoose";
import Book from "../../models/Book";
import client from "../elasticsearch";

interface IBook extends Document {
  authors: string[];
  contents: string;
  thumbnail: string;
  title: string;
}

export default async () => {
  console.log("MIGRATING BOOKS TO ELASTICSEARCH:::");
  try {
    const books = await Book.find({});
    for (let i = 0; i < books.length; i += 3500) {
      // 3500 docs: ~4.5MB batch
      const batch: Document[] = books.slice(i, i + 3500);
      let body: object[] = [];
      batch.forEach((book: Document) => {
        const { authors, contents, thumbnail, title } = book as IBook;
        const indexOp = [
          { index: { _index: "books", _id: book.id } },
          { authors, contents, thumbnail, title }
        ];
        body = body.concat(indexOp);
      });
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
    const { body: count } = await client.count({ index: "books" });
    console.log("# of indexed books", count);
  } catch (error) {
    console.log(error);
  }
};
