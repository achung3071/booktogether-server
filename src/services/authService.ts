import User from "../models/User";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import transporter from "../config/ses-email";
dotenv.config();

interface IUserInfo {
  email: string;
  name: string;
  password: string;
}

interface IAuthService<T = Promise<object>> {
  signUp: (userInfo: IUserInfo) => T;
  login: (userInfo: IUserInfo) => T;
  findpw: (email: string) => T;
  checkpw: (userInfo: object) => T;
}

const authService: IAuthService = {
  signUp: async (userInfo: IUserInfo): Promise<object> => {
    const existing = await User.findOne({ email: userInfo.email });
    if (existing) {
      return {
        error: {
          status: 409,
          type: "DuplicateEmail",
          message: "이미 사용중인 이메일 주소입니다."
        }
      };
    }
    const hashedPassword: string = await bcrypt.hash(userInfo.password, 10);
    const user: any = new User({ ...userInfo, password: hashedPassword });
    await user.save();
    return { message: "성공적으로 가입 되었습니다." };
  },

  login: async (userInfo: IUserInfo): Promise<object> => {
    const { email, password } = userInfo;
    const user: any = await User.findOne({ email, accountType: "standard" });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return {
        error: {
          status: 401,
          type: "LoginFailed",
          message: "입력하신 이메일과 비밀번호가 일치하지 않습니다."
        }
      };
    }
    return { id: user.id, message: "성공적으로 로그인 되었습니다." };
  },

  findpw: async (email: string): Promise<object> => {
    const user: any = await User.findOne({ email, accountType: "standard" });
    if (!user) {
      return Promise.reject({
        status: 404,
        type: "EmailNotFound",
        message: "입력하신 이메일로 가입되어 있는 일반 계정이 없습니다."
      });
    } else if (user.emailError) {
      return Promise.reject({
        status: 403,
        type: "EmailError",
        message:
          "해당 이메일의 차단 또는 스팸 설정으로 인해 재설정 링크를 보낼 수 없습니다."
      });
    }
    const token = crypto.randomBytes(20).toString("hex");
    await user.updateOne({
      resetPasswordToken: token,
      resetPasswordExpires: Date.now() + 600000
    });
    const mailOptions = {
      from: process.env.APP_EMAIL,
      to: email,
      subject: "서로모임 - 비밀번호 재설정 링크",
      text: `서로모임 비밀번호 변경을 원하신다면 다음 링크를 클릭해주세요:\n${process.env.CLIENT_URL}/reset/${token}`
    };
    try {
      const res = await transporter.sendMail(mailOptions);
      console.log(res.envelope);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  },

  checkpw: async ({ user, password }: { user: string; password: string }) => {
    const userDoc: any = await User.findById(user);
    if (!(await bcrypt.compare(password, userDoc.password))) {
      return Promise.reject({
        status: 401,
        type: "IncorrectPassword",
        message: "비밀번호가 일치하지 않습니다."
      });
    }
    return { result: true };
  }
};

export default authService;
