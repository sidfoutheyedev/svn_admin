import winston from 'winston';
const { combine, timestamp, printf, colorize } = winston.format;

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "info",
      format: combine(
        timestamp({ format: "HH:mm:ss" }),
        colorize(),
        printf(({ timestamp: ts, level, message }) => `${ts} ${level} : ${message}`)
      ),
    }),
  ],
});

export const Log = { logger };
