import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Configuración de transports
const transports = [
  // Logs de error con rotación
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: customFormat,
  }),
  
  // Logs combinados (info, warn, error) con rotación
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: customFormat,
  }),
];

// En desarrollo, también mostrar en consola con colores
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Crear el logger
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports,
  // No salir en caso de error de logging
  exitOnError: false,
});

// Métodos de conveniencia
export const logError = (message, error) => {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack });
  } else {
    logger.error(message, { error });
  }
};

export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

export default logger;
