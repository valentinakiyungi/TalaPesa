import * as functions from 'firebase-functions/v2/https';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, conf: { distDir: '.next' } });
const handle = app.getRequestHandler();

export const nextServer = functions.onRequest(async (req, res) => {
  try {
    await app.prepare();
    return handle(req, res);
  } catch (err: unknown) {
    console.error('Next.js server error:', err);
    res.status(500).send('Internal Server Error');
  }
});