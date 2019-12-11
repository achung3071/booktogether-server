interface IError {
  error: {
    status: number;
    type: string;
    message: string;
  };
}

export default IError;
