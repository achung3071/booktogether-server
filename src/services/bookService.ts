import { Document } from "mongoose";
import Book from "../models/Book";
import Curation from "../models/Curation";
import Review from "../models/Review";
import updateQueryResults from "../helpers/query/updateQueryResults";

interface IQuery {
  curation: string;
  review: string;
}

interface ISearchQuery {
  query: string;
  size: number;
  page: number;
}

const bookService = {
  getBooks: async (query: IQuery) => {
    let books: Document[];
    const { curation, review } = query;

    if (review) {
      const reviewDoc: any = await Review.findById(review).populate("books");
      books = updateQueryResults(books, reviewDoc.books);
    }
    if (curation) {
      const curationDoc: any = await Curation.findById(curation).populate(
        "books"
      );
      books = updateQueryResults(books, curationDoc.books);
    }
    return books;
  },

  getBook: async (id: string) => {
    return await Book.findById(id);
  },

  searchBooks: ({ query, page, size }: ISearchQuery) => {
    size = size ? size : 20;
    page = page ? page : 1;
    return Book.search({ query, page, size });
  }
};

export default bookService;
