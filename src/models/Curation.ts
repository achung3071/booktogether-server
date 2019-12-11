import mongoose, { Document, Model } from "mongoose";
const Schema: any = mongoose.Schema;

export const CurationSchema: mongoose.Schema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User" },
    books: [{ type: Schema.Types.ObjectId, ref: "Book" }],
    contents: String,
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    title: String
  },
  { versionKey: false }
);

const Curation: Model<Document, {}> = mongoose.model(
  "Curation",
  CurationSchema
);
export default Curation;
