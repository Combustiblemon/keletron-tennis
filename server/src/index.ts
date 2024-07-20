import { ExpressAuth } from '@auth/express';
import express, { type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import signale from 'signale';

import { getAuthConfig } from './auth/config';
import { authenticatedUser } from './middleware/auth';
import { errorHandler, errorNotFoundHandler } from './middleware/error';

const SERVER_PORT = process.env.PORT;

const app = express();

app.set('port', SERVER_PORT);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

if (process.env.ISPRODUCTION === 'true') {
  // Apply the rate limiting middleware to all requests.
  app.use(limiter);
  signale.info('Rate limiting enabled');
}

// Parse incoming requests data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up ExpressAuth to handle authentication
// IMPORTANT: It is highly encouraged set up rate limiting on this route
app.use('/api/auth/*', async (req, res) => {
  return ExpressAuth(await getAuthConfig(req, res));
});

// Routes
app.get('/protected', async (_req: Request, res: Response) => {
  res.json({ session: res.locals.session });
});

app.get(
  '/api/protected',
  authenticatedUser,
  async (_req: Request, res: Response) => {
    res.json(res.locals.session);
  }
);

app.get('/', async (_req: Request, res: Response) => {
  res.json({
    title: 'Express Auth Example',
    user: res.locals.session?.user,
  });
});

// Error handlers
app.use(errorNotFoundHandler);
app.use(errorHandler);

const server = app.listen(SERVER_PORT, () => {
  signale.success(
    'API listening at port',
    (server?.address?.() as { port: number })?.port
  );
});

const skipErrorNames: string[] = [];

// catch any uncaught exceptions, so that the server never crashes
process.on('uncaughtException', (err: Error) => {
  signale.error('Problem: uncaughtException', err);
});

process.on('unhandledRejection', (reason: unknown, p: Promise<unknown>) => {
  if (skipErrorNames.includes((reason as Error).name)) {
    return;
  }

  signale.error(
    'Problem: Unhandled Rejection at: Promise',
    p,
    'reason:',
    reason
  );
});
