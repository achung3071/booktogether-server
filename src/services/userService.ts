import User from "../models/User";
import bcrypt from "bcrypt";

interface IQuery {
  resetPasswordToken: string;
  user: string;
  patchBody?: any;
}

const userService = {
  getUser: async ({ resetPasswordToken, user }: IQuery) => {
    if (resetPasswordToken) {
      const userDoc: any = await User.findOne({ resetPasswordToken })
        .populate({
          path: "to_read.book reading.book finished.book",
          select: "authors thumbnail title"
        })
        .select("-password");
      if (!userDoc) {
        const message: string = "잘못된 비밀번호 재설정 토큰입니다.";
        return Promise.reject({ status: 404, type: "InvalidToken", message });
      } else if (Date.now() >= userDoc.resetPasswordExpires) {
        const message: string =
          "만료된 토큰입니다. 비밀번호 재설정 요청을 다시 해주세요.";
        return Promise.reject({ status: 403, type: "ExpiredToken", message });
      } else {
        return userDoc;
      }
    } else {
      return await User.findById(user)
        .populate({
          path: "to_read.book reading.book finished.book",
          select: "authors thumbnail title"
        })
        .select("-password");
    }
  },

  patchUser: async ({ resetPasswordToken, user, patchBody }: IQuery) => {
    if (patchBody.password) {
      patchBody.password = await bcrypt.hash(patchBody.password, 10);
    }
    if (resetPasswordToken) {
      // If we want to reset a lost password
      const userDoc: any = await User.findOne({ resetPasswordToken });
      if (!userDoc) {
        const message: string = "잘못된 비밀번호 재설정 토큰입니다.";
        return Promise.reject({ status: 404, type: "InvalidToken", message });
      } else if (Date.now() >= userDoc.resetPasswordExpires) {
        const message: string =
          "만료된 토큰입니다. 비밀번호 재설정 요청을 다시 해주세요.";
        return Promise.reject({ status: 403, type: "ExpiredToken", message });
      } else {
        await userDoc.updateOne(patchBody);
        return await User.findById(userDoc.id)
          .populate({
            path: "to_read.book reading.book finished.book",
            select: "authors thumbnail title"
          })
          .select("-password");
      }
    } else {
      await User.findByIdAndUpdate(user, patchBody);
      return await User.findById(user)
        .populate({
          path: "to_read.book reading.book finished.book",
          select: "authors thumbnail title"
        })
        .select("-password");
    }
  }
};

export default userService;
