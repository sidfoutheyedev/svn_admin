import mongoose from 'mongoose';
import { Log } from "../utils";
import config from "../config";
const { logger } = Log;

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(1);
});

mongoose.set("strictQuery", true);

const connect = async () => {
  logger.info("Connecting to MongoDB...");
  await mongoose.connect(config.mongo.mongoURI, {
    socketTimeoutMS: 60000,
    maxPoolSize: 10,
  });
  logger.info("MongoDB connected");
  return mongoose.connection;
};

const disconnect = async () => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};

export const MongoManager = { connect, disconnect };
