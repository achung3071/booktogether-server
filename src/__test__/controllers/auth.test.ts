import app from "../../../app";
import User from "../../models/User";
import request from "supertest";

describe("Authentication", () => {
  describe("POST /auth/signup", () => {
    beforeEach(done => {
      // Remove all records before each test
      User.deleteMany({}, () => done());
    });

    it("should register a new user", done => {
      const user = {
        name: "Jest",
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/signup")
        .send(user)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(201);
          expect(res.body).toHaveProperty(
            "message",
            "성공적으로 가입 되었습니다."
          );
          done();
        });
    });
    it("should handle incomplete requests", done => {
      const user = {
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/signup")
        .send(user)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(400);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toHaveProperty("type", "InvalidBody");
          done();
        });
    });
    it("should return a 409 error if a duplicate email exists", done => {
      const user = {
        name: "jest",
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/signup")
        .send(user)
        .end(() => {
          request(app)
            .post("/auth/signup")
            .send(user)
            .end((err: any, res: any) => {
              expect(res.statusCode).toBe(409);
              expect(res.body).toHaveProperty("error");
              expect(res.body.error).toHaveProperty("type", "DuplicateEmail");
              done();
            });
        });
    });
  });

  describe("POST /auth/login", () => {
    beforeAll(async done => {
      await User.deleteMany({});
      const user = {
        name: "jest",
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/signup")
        .send(user)
        .end(() => done());
    });

    it("should log in when there is an existing user", done => {
      const userInfo = {
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/login")
        .send(userInfo)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toHaveProperty(
            "message",
            "성공적으로 로그인 되었습니다."
          );
          done();
        });
    });
    it("should handle incomplete requests", done => {
      const userInfo = {
        email: "jest@gmail.com"
      };
      request(app)
        .post("/auth/login")
        .send(userInfo)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(400);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toHaveProperty("type", "InvalidBody");
          done();
        });
    });
    it("should return a 401 error if the login info is incorrect", done => {
      const userInfo = {
        email: "jest@gmail.com",
        password: "jest123"
      };
      request(app)
        .post("/auth/login")
        .send(userInfo)
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(401);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toHaveProperty("type", "LoginFailed");
          done();
        });
    });

    // it("should create a persistent session")
  });

  describe("POST /auth/logout", () => {
    beforeAll(async done => {
      await User.deleteMany({});
      const user = {
        name: "jest",
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/signup")
        .send(user)
        .end(() => done());
    });

    beforeEach(done => {
      const userInfo = {
        email: "jest@gmail.com",
        password: "jest1234"
      };
      request(app)
        .post("/auth/login")
        .send(userInfo)
        .end(() => done());
    });

    it("should return the correct response", done => {
      request(app)
        .post("/auth/logout")
        .end((err: any, res: any) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toHaveProperty(
            "message",
            "성공적으로 로그아웃 되었습니다."
          );
          done();
        });
    });

    // it("should delete an existing session");
  });
});
