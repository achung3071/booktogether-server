import mongoose, { HookNextFunction } from "mongoose";
import client from "../config/elasticsearch";
import { esIndexBook } from "../helpers/middleware/esIndex";
const Schema: any = mongoose.Schema;

interface ISearchQuery {
  query: string;
  page: number;
  size: number;
}

interface ISearchResults {
  books: object[];
  results_count: number;
  pageable_count: number;
  current_page: number;
  is_end: boolean;
}

export const BookSchema: mongoose.Schema = new Schema(
  {
    authors: [String],
    contents: String,
    datetime: Date,
    isbn: String,
    price: Number,
    publisher: String,
    sale_price: Number,
    thumbnail: String,
    title: String,
    translators: [String],
    url: String
  },
  { versionKey: false }
);

// Updated index in ElasticSearch as well as MongoDB
BookSchema.pre("save", async function(next: HookNextFunction): Promise<void> {
  await esIndexBook(this);
  next();
});
BookSchema.post("findOneAndDelete", doc => {
  client.delete({ id: doc.id, index: "books", refresh: "true" });
});

// Return paginated search results from ElasticSearch
BookSchema.statics.search = async ({ query, page, size }: ISearchQuery) => {
  const results: ISearchResults = {} as ISearchResults;
  const response = await client.search({
    index: "books",
    from: (page - 1) * size,
    size,
    sort: "_score",
    body: {
      query: {
        multi_match: {
          query,
          analyzer: "standard",
          fields: ["authors", "title^2"]
        }
      }
    }
  });
  results.books = response.body.hits.hits.map((result: any) => {
    result._source._id = result._id;
    return result._source;
  });
  results.results_count = response.body.hits.total.value;
  results.pageable_count = Math.ceil(results.results_count / size);
  results.current_page = page;
  results.is_end = page >= results.pageable_count;
  return results;
};

const Book: any = mongoose.model("Book", BookSchema);

export default Book;
