import IError from "./errorInterface";

function Unauthorized(message: string): IError {
  const status: number = 401;
  const type: string = "Unauthorized";
  return { error: { status, type, message } };
}

export default Unauthorized;
