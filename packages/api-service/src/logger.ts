import {createLogger, format, transports} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const {combine, timestamp, label, printf, colorize} = format;

// Define a custom log format
const myFormat = printf(({level, message, label, timestamp}) => {
  return `[${label}] ${timestamp} - ${level}: ${message}`;
});

// Define the options for the log rotation
const rotationOptions = {
  filename: 'logs/general/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  zippedArchive: true,
  level: 'silly',
  format: combine(timestamp(), myFormat)
};

// Create the logger instance
const logger = createLogger({
  // Set the default log level
  level: 'silly',
  // Combine different formatters for the logger
  format: combine(
    // Add a label to the logs
    label({
      label: `passwordkeeper.api-service.${process.env.NODE_ENV?.toUpperCase() ?? 'DEVELOPMENT'}`
    }),
    // Add a timestamp to the logs
    timestamp(),
    // Apply the custom format
    myFormat
  ),
  // Define the transports for logging
  transports: [
    // general logs
    new DailyRotateFile({...rotationOptions}),
    // error logs
    new DailyRotateFile({
      ...rotationOptions,
      filename: 'logs/error/error-%DATE%.log',
      level: 'error'
    }),
    // http logs
    new DailyRotateFile({
      ...rotationOptions,
      filename: 'logs/http/http-%DATE%.log',
      level: 'http'
    }),
    // warning logs
    new DailyRotateFile({...rotationOptions, filename: 'logs/warn/warn-%DATE%.log', level: 'warn'}),
    // info logs
    new DailyRotateFile({...rotationOptions, filename: 'logs/info/info-%DATE%.log', level: 'info'})
  ]
});

// Add console transport for development environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: combine(colorize(), myFormat)
    })
  );
}

export default logger;
