import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFound = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      status: StatusCodes.NOT_FOUND
    }
  });
};