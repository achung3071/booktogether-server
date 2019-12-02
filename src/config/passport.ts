import dotenv from "dotenv";
import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as KakaoStrategy } from "passport-kakao";
import User from "../models/User";
dotenv.config();

export default () => {
  const fbCredentials = {
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/facebook/callback`,
    enableProof: true, // Require app secret for API reqs
    profileFields: ["id", "displayName", "photos", "email"]
  };

  const kakaoCredentials = {
    clientID: process.env.KAKAO_API_KEY,
    clientSecret: process.env.KAKAO_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/kakao/callback`
  };

  // Passport receives user profile info after redirect to callbackURL
  const callback = (provider: string) => async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any
  ) => {
    const email =
      provider === "kakao"
        ? profile._json.kakao_account.email
        : profile.emails[0].value;
    let user: any = await User.findOne({ email });
    if (!user) {
      user = new User({
        accountType: provider,
        email,
        name: profile.displayName
      });
      await user.save();
    }
    done(null, user); // passed to serializeUser, or authenticate() if { session: false }
  };
  passport.use(new FacebookStrategy(fbCredentials, callback("facebook")));
  passport.use(new KakaoStrategy(kakaoCredentials, callback("kakao")));

  /* Note: these are not necessary b/c we set session.user manually anyways.
  // serializeUser: write id to req.session.passport.user after authentication
  passport.serializeUser((user: any, done: any) => {
    done(null, user);
  });
  // On subsequent HTTP requests, if req.session.passport.user exists,
  // deserializeUser attaches the relevant user data to req as req.user.
  passport.deserializeUser((user: string, done: any) => {
    done(null, user);
  }); */
};