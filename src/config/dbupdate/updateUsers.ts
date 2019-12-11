import User from "../../models/User";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Separate code for adding new default fields to each user
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    const users = await User.find({});
    for (const user of users) {
      user.save();
    }
  });
