import IError from "./errorInterface";

function NotFound(type: string, message: string): IError {
  const status: number = 404;
  return { error: { status, type, message } };
}

export default NotFound;
