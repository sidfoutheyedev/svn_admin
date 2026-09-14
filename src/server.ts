import appModule from './app';
import configModule from '../packages/config/index';
import * as managerModule from '../packages/manager/index';

const app = appModule;
const config = configModule;
const { logger, mongoManager } = managerModule;
let server: import('http').Server | undefined;

const startServer = async () => {
  await mongoManager.connect();
  const { port, host, name } = config.app;
  server = app.listen(port, host, () => {
    logger.info(`${name} running on http://${host}:${port}`);
  });
};

const shutdown = async (code = 0) => {
  if (server) {
    server.close(async () => {
      await mongoManager.disconnect();
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
};

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  void shutdown(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  void shutdown(0);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
  void shutdown(1);
});

startServer().catch((err) => {
  logger.error(err);
  process.exit(1);
});
