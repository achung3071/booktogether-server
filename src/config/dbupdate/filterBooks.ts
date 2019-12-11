import Book from "../../models/Book";
import mongoose, { Document } from "mongoose";
import dotenv from "dotenv";
import Rating from "../../models/Rating";
import Review from "../../models/Review";
import Curation from "../../models/Curation";
dotenv.config();

interface IBook extends Document {
  title: string;
  authors: string[];
}

const deleteRelatedDocs = async (id: string) => {
  await Rating.deleteMany({ book: id });
  await Curation.deleteMany({ books: id });
  const reviews = await Review.find({ books: id });
  for (const review of reviews) {
    // Used instead of deleteMany to update elasticsearch with hook
    await Review.findByIdAndDelete(review.id);
  }
};

// Code for updating book collection that isn't properly filtered
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log("FILTERING BOOKS IN DB:::");
    const allBooks: IBook[] = await Book.find({});
    const avoidWords = [
      "찬송가",
      "성경",
      "세트",
      "샘플",
      "컬러링북",
      "ebook",
      "epub",
      "sample"
    ];
    for (const book of allBooks) {
      if (avoidWords.some(word => book.title.toLowerCase().includes(word))) {
        await deleteRelatedDocs(book.id);
        await Book.findByIdAndDelete(book.id);
      } else {
        const { title, authors } = book;
        const identicalBooks: IBook[] = await Book.find({ title, authors });
        if (identicalBooks.length > 1) {
          // await needed b/c books might be deleted simultaneously if operation is async
          await deleteRelatedDocs(book.id);
          await Book.findByIdAndDelete(book.id);
        }
      }
    }
    console.log("All books in DB filtered according to guidelines.");
  })
  .catch(err => console.log(err.message));
