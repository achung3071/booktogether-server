import mongoose, { Model, Document } from "mongoose";
const Schema: any = mongoose.Schema;

export const UserSchema: mongoose.Schema = new Schema(
  {
    accountType: { type: String, default: "standard" },
    email: String,
    emailError: { type: Boolean, default: false },
    image: { type: String, default: null },
    name: String,
    oauthId: { type: String, default: null },
    password: { type: String, default: null },
    profile: { type: String, default: "" },
    to_read: [{ book: { type: Schema.Types.ObjectId, ref: "Book" } }],
    reading: [
      {
        _id: false,
        book: { type: Schema.Types.ObjectId, ref: "Book" },
        start: Date,
        goal: Date
      }
    ],
    finished: [
      {
        _id: false,
        book: { type: Schema.Types.ObjectId, ref: "Book" },
        start: Date,
        end: Date
      }
    ],
    numBooksGoal: { type: Number, default: 10 },
    numReviewsGoal: { type: Number, default: 10 },
    resetPasswordToken: String,
    resetPasswordExpires: Number
  },
  { versionKey: false }
);

const User: Model<Document, {}> = mongoose.model("User", UserSchema);
export default User;
