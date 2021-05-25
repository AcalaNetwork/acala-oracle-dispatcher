/* eslint-disable */

import express from 'express';
import { defaultLogger, HeartbeatGroup } from '@open-web3/util';

const logger = defaultLogger.createLogger('api');

const createServer = (options: { port: number | string; heartbeats: HeartbeatGroup }) => {
  try {
    const app = express();

    app.get('/health', async (req, res) => {
      const summary = await options.heartbeats.summary();
      if (!summary.isAlive) {
        res.status(503);
      }
      res.send(summary);
    });

    app.listen(options.port, () => {
      logger.info('API server started at port', options.port);
    });

    return app;
  } catch (error) {
    logger.error('Failed to start API server', error);
    throw error;
  }
};

export default createServer;
