import IError from "./errorInterface";

const status: number = 500;
const type: string = "InternalError";
const message: string = "요청을 처리하는 중 서버에 에러가 발생했습니다.";
const InternalError: IError = { error: { status, type, message } };

export default InternalError;
