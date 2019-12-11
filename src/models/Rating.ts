import mongoose, { Document, Model } from "mongoose";
const Schema: any = mongoose.Schema;

export const RatingSchema: mongoose.Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    book: { type: Schema.Types.ObjectId, ref: "Book" },
    rating: { type: Number }
  },
  { versionKey: false }
);

const Rating: Model<Document, {}> = mongoose.model("Rating", RatingSchema);
export default Rating;
