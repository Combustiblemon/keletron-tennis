import { getSession } from '@auth/express';
import type { NextFunction, Request, Response } from 'express';

import { getAuthConfig } from '../auth/config';

export async function authenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session =
    res.locals.session ??
    (await getSession(req, await getAuthConfig(req, res))) ??
    undefined;

  res.locals.session = session;

  if (session) {
    return next();
  }

  return res.status(401).json({ message: 'Not Authenticated' });
}

// export async function currentSession(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   if (!res.locals.session) {
//     const session =
//       (await getSession(req, await getAuthConfig(req, res))) ?? undefined;
//     res.locals.session = session;
//   }

//   return next();
// }
