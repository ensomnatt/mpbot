import { createLogger, format, transports } from "winston";
import fs from "fs";

const env = process.env.NODE_ENV || "dev";
const logLevel = process.env.LOG_LEVEL || "info";

if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

const consoleFormat = format.combine(
  format.colorize(),
  format.printf(({ level, message }) => {
    return `${level}: ${message}`;
  })
);

const logger = createLogger({
  level: logLevel,
  format: fileFormat,
  transports: [
    new transports.File({ filename: "logs/combined.log" }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

if (env === "dev") {
  logger.add(
    new transports.Console({
      format: consoleFormat,
    })
  );
}

export default logger;
