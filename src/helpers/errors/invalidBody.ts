import IError from "./errorInterface";

const status: number = 400;
const type: string = "InvalidBody";
const message: string =
  "모든 필수 입력 필드에 올바른 형식으로 정보를 채우세요.";
const InvalidBody: IError = { error: { status, type, message } };

export default InvalidBody;
