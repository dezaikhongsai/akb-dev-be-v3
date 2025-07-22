import { Request, Response, NextFunction } from 'express'
import { ApiError,HTTP_STATUS, ApiResponse } from '../constants';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof ApiError ? err.statusCode : HTTP_STATUS.SERVER_ERROR.INTERNAL_SERVER
  const result : ApiResponse<any> = {
    status : 'error',
    message : err.message || "Internal Server Error"
  }
  res.status(statusCode).json(result);
}
