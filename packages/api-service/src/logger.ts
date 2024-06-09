import {createLogger, format, transports} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const {combine, timestamp, label, printf, colorize} = format;

// Define a custom log format
const myFormat = printf(({level, message, label, timestamp}) => {
  return `[${label}] ${timestamp} - ${level}: ${message}`;
});

// Define the options for the log rotation
const rotationOptions = {
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  zippedArchive: true,
  level: 'info',
  format: combine(timestamp(), myFormat)
};

// Create the logger instance
const logger = createLogger({
  // Set the default log level
  level: 'info',
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
    // Daily rotate file transport for general logs
    new DailyRotateFile({...rotationOptions}),
    // Daily rotate file transport for error logs
    new DailyRotateFile({...rotationOptions, filename: 'logs/error-%DATE%.log', level: 'error'})
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
