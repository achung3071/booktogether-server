import IError from "./errorInterface";

const status: number = 400;
const type: string = "InvalidQuery";
const message: string =
  "모든 필수 입력 필드에 올바른 형식으로 정보를 채우세요.";
const InvalidQuery: IError = { error: { status, type, message } };

export default InvalidQuery;
