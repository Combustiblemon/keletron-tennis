/* eslint-disable max-classes-per-file */
import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Render the error page
  res.status(500);
  res.render('error', {
    title: 'status' in err ? err.status : err.name,
    message: err.message,
  });
};

export const errorNotFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new Error('notFound'));
};
