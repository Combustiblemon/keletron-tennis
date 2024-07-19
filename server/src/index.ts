import { ExpressAuth } from '@auth/express';
import express, { type Request, type Response } from 'express';
import nconf from 'nconf';
import signale from 'signale';

import { getAuthConfig } from './auth/config';
import { authenticatedUser, currentSession } from './middleware/auth';
import { errorHandler, errorNotFoundHandler } from './middleware/error';

nconf.argv().env().file('./config.json');

const SERVER_PORT = nconf.get('PORT');

const app = express();

app.set('port', SERVER_PORT);

// Parse incoming requests data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set session in res.locals
app.use(currentSession);

// Set up ExpressAuth to handle authentication
// IMPORTANT: It is highly encouraged set up rate limiting on this route
app.use('/api/auth/*', async (req, res) =>
  ExpressAuth(await getAuthConfig(req, res))
);

// Routes
app.get('/protected', async (_req: Request, res: Response) => {
  res.render('protected', { session: res.locals.session });
});

app.get(
  '/api/protected',
  authenticatedUser,
  async (_req: Request, res: Response) => {
    res.json(res.locals.session);
  }
);

app.get('/', async (_req: Request, res: Response) => {
  res.render('index', {
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
